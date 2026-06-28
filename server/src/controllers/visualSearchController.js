import { scoreVisualSearchSimilarity } from '../services/visualSearchAiService.js'
import { success } from '../utils/apiResponse.js'

export async function scoreVisualSearch(req, res, next) {
  try {
    const data = await scoreVisualSearchSimilarity({
      config: req.app.locals.config,
      chatClient: req.app.locals.aiChatClient,
      body: req.body
    })

    res.json(success(data))
  } catch (error) {
    next(error)
  }
}
