import dotenv from "dotenv"
dotenv.config({ path: "/Users/jaynarendrarajput/Downloads/Backend/.env" })

async function run() {
  const { connectDatabase, disconnectDatabase } = await import("../database/mongoose.js")
  const { register } = await import("../auth/service.js")
  const { User } = await import("../auth/User.js")
  const { Customer } = await import("../domains/models.js")

  const uri = process.env.MONGODB_URI
  console.log("Connecting to MONGODB_URI:", uri ? "URI present" : "URI missing")
  const status = await connectDatabase(uri)
  console.log("Database status:", status)
  if (status !== "connected") {
    throw new Error("Failed to connect to MongoDB Atlas")
  }

  const timestamp = Date.now()
  const testEmail = `testcustomer_${timestamp}@example.com`
  const testPassword = "Password@123456"
  const testName = `Test Customer ${timestamp}`

  console.log("Registering customer:", testEmail)
  const result = await register({
    email: testEmail,
    password: testPassword,
    displayName: testName,
    phone: "9876543210"
  })

  console.log("Registration API returned result user id:", result.user.id)
  console.log("Access Token received:", result.accessToken ? "YES" : "NO")

  // Verify in MongoDB Atlas directly
  const mongoUser = await User.findOne({ loginIdentifier: testEmail.toLowerCase() })
  console.log("MongoDB Atlas User found:", mongoUser ? mongoUser._id : null)

  const mongoCustomer = await Customer.findOne({ email: testEmail.toLowerCase() })
  console.log("MongoDB Atlas Customer found:", mongoCustomer ? mongoCustomer._id : null)

  if (!mongoUser || !mongoCustomer) {
    throw new Error("Verification failed: User or Customer missing in MongoDB Atlas!")
  }

  if (String(mongoUser.customerId) !== String(mongoCustomer._id)) {
    throw new Error("Verification failed: User customerId does not match Customer _id!")
  }

  console.log("VERIFICATION SUCCESSFUL! Customer & User created in MongoDB Atlas.")

  // Cleanup test user & customer
  await User.deleteOne({ _id: mongoUser._id })
  await Customer.deleteOne({ _id: mongoCustomer._id })
  console.log("Cleaned up test records from MongoDB Atlas.")

  await disconnectDatabase()
}

run().catch((err) => {
  console.error("Verification failed:", err)
  process.exit(1)
})
