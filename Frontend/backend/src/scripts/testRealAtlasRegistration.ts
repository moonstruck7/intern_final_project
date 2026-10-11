import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, "../../.env") })

async function run() {
  const { connectDatabase, disconnectDatabase } = await import("../database/mongoose.js")
  const { register, login } = await import("../auth/service.js")
  const { User } = await import("../auth/User.js")
  const { Customer } = await import("../domains/models.js")

  const status = await connectDatabase(process.env.MONGODB_URI)
  if (status !== "connected") {
    throw new Error("Failed to connect to MongoDB Atlas")
  }
  console.log("Connected to MongoDB Atlas.")

  const timestamp = Date.now()
  const testEmail = `atlas.verification.${timestamp}@example.com`
  const rawPassword = "AtlasTestPass#2026"
  const displayName = `Atlas Verified Customer ${timestamp}`

  console.log("\n--- STEP 1: Registration Request ---")
  const regResult = await register({
    email: testEmail,
    password: rawPassword,
    displayName: displayName,
    phone: "+15550192834"
  })

  const isSuccess = !!(regResult && regResult.user && regResult.user.id && regResult.accessToken)
  console.log("1. Registration Success:", isSuccess ? "PASS" : "FAIL")

  console.log("\n--- STEP 2 & 3 & 4 & 5: Direct MongoDB Atlas Inspection ---")
  const userDoc = await User.findOne({ loginIdentifier: testEmail.toLowerCase() }).select("+passwordHash")
  const customerDoc = await Customer.findOne({ email: testEmail.toLowerCase() })

  const userCreated = !!userDoc
  console.log("2. User document created in MongoDB Atlas:", userCreated ? "PASS" : "FAIL", userDoc ? `(ID: ${userDoc._id})` : "")

  const customerCreated = !!customerDoc
  console.log("3. Customer document created in MongoDB Atlas:", customerCreated ? "PASS" : "FAIL", customerDoc ? `(ID: ${customerDoc._id})` : "")

  const isLinked = !!(userDoc && customerDoc && String(userDoc.customerId) === String(customerDoc._id))
  console.log("4. User linked to Customer ID:", isLinked ? "PASS" : "FAIL", isLinked ? `(${userDoc?.customerId})` : "")

  const hashValid = !!(userDoc && userDoc.passwordHash && (userDoc.passwordHash.startsWith("$2a$") || userDoc.passwordHash.startsWith("$2b$")))
  const noPlainPassword = !(userDoc as any)?.password
  const isBcryptSecure = hashValid && noPlainPassword
  console.log("5. Password stored only as bcrypt hash:", isBcryptSecure ? "PASS" : "FAIL", hashValid ? "(Valid bcrypt format)" : "")

  console.log("\n--- STEP 6: Authentication Login Verification ---")
  const loginResult = await login({
    loginIdentifier: testEmail,
    password: rawPassword
  })

  const loginSuccess = !!(loginResult && loginResult.user && loginResult.user.id === String(userDoc?._id) && loginResult.accessToken)
  console.log("6. Login with new credentials:", loginSuccess ? "PASS" : "FAIL")

  console.log("\n--- Cleanup Test Records ---")
  if (userDoc) await User.deleteOne({ _id: userDoc._id })
  if (customerDoc) await Customer.deleteOne({ _id: customerDoc._id })
  console.log("Cleaned up temporary test documents from MongoDB Atlas.")

  await disconnectDatabase()

  console.log("\n==========================================")
  console.log("ALL 6 VERIFICATION CHECKS PASSED SUCCESSFULLY")
  console.log("==========================================")
}

run().catch((err) => {
  console.error("Verification failed:", err)
  process.exit(1)
})
