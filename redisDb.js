const bluebird = require('bluebird')
const redis = require('redis')

class RedisDB {
  constructor() {
    this.redis = bluebird.promisifyAll(redis)
  }

  connectDB() {
    const client = this.redis.createClient()

    client.once('error', (err) => {
      console.error('Redis connect error', err)
      process.exit(1)
    })

    client.on('ready', () => {
      console.log('Redis connected')
    })
    return client
  }
}

module.exports = new RedisDB().connectDB()
