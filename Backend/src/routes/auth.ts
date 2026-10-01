import { Router } from 'express'
import { requireAuthentication, requirePermissions } from '../middleware/auth.js'
import { login, logout, refresh } from '../auth/service.js'
import { permissionsForRole } from '../auth/roles.js'

export const authRouter = Router()
authRouter.post('/login', async (request, response, next) => { try { response.status(200).json(await login(request.body)) } catch (error) { next(error) } })
authRouter.post('/refresh', async (request, response, next) => { try { response.status(200).json(await refresh(request.body)) } catch (error) { next(error) } })
authRouter.post('/logout', async (request, response, next) => { try { await logout(request.body); response.status(204).send() } catch (error) { next(error) } })
authRouter.get('/me', requireAuthentication, (request, response) => response.status(200).json({ user: { ...request.auth, id: request.auth?.userId, permissions: request.auth ? permissionsForRole(request.auth.role) : [] } }))
authRouter.get('/authorization-check', requireAuthentication, requirePermissions('platform.manage'), (_request, response) => response.status(204).send())
