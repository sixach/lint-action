import http, {IncomingMessage} from 'http'
import {PostRequestOptions} from '../types'
import https from 'https'

/**
 * Helper function for making HTTP requests
 * @param {string} url - Request URL
 * @param {object} options - Request options
 * @returns {Promise<string>} - JSON response
 */
async function request(
  url: string,
  options: PostRequestOptions
): Promise<string> {
  const get = url.startsWith('https:') ? https.request : http.request

  return new Promise((resolve, reject) => {
    const req = get(url, options, (res: IncomingMessage) => {
      let rawData = ''

      // Receive data
      res.on('data', chunk => (rawData += chunk))

      // Check status code after data been received
      res.on('end', () => {
        try {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(rawData)
          } else {
            reject(res.statusCode)
          }
        } catch (error) {
          reject(error)
        }
      })

      // Something bad happened
      res.on('error', error => {
        reject(error)
      })
    })

    if (options.body) {
      req.write(options.body)
    }

    req.end()
  })
}

export default request
