import { createAiConsultReply } from '../services/aiConsultService.js'
import { success } from '../utils/apiResponse.js'

export async function createAiConsult(req, res, next) {
  try {
    const data = await createAiConsultReply({
      db: req.app.locals.db,
      config: req.app.locals.config,
      chatClient: req.app.locals.aiChatClient,
      body: req.body
    })

    res.json(success(data))
  } catch (error) {
    next(error)
  }
}
