const express = require('express')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const app = express()
require('dotenv').config()
const baseRouter = express.Router()
const monk = require('monk')(process.env.MONGO_URI)
const { nanoid } = require('nanoid')
const urls = monk.get('urls')
const urx = require('url')
app.use(morgan('tiny'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static(`${__dirname}/public`))


baseRouter.get('/', (req, res) => {
    res.sendFile(`${__dirname}/views/index.html`)
})

baseRouter.get('/:id', async (req, res) => {
    try {
        const hash = req.params.id
        let result = await urls.find({ shortHash: hash })
        if (result.length > 0) {
            console.log(result[0])
            if (result[0]?.srcUrl) {
                res.status(301)
                res.redirect(result[0].srcUrl)
            }
        }
    }
    catch (e) {
        console.log(e)
        res.json({ error: e })
    }

})

baseRouter.post('/', async (req, res) => {
    const { value } = req.body
    const urlPattern = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/gm
    if (!urlPattern.test(value)) {
        res.status(500)
        res.json({ error: 'Invalid URL format' })
    }
    const shortHash = nanoid(6)
    const dbObj = {
        srcUrl: value,
        shortHash
    }

    await urls.insert(dbObj)
    res.json({ shortened: `${process.env.DEPLOYED_URL}${shortHash}` })
})

app.use('/', baseRouter)

const port = process.env.PORT || 4000
app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
})