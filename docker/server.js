// const http = require('http')
const url = require('url')
const syncrequest = require('sync-request')
const ronin     = require( 'ronin-server' )
const mysql = require('mysql')

function validate(value, name) {
  // TODO validate data - regexp?
  if (!value) {
    return `No value was found for '${name}'. Please ensure a value was entered.`
  }
  var trimmedValue = value.trim()
  if (trimmedValue.startsWith('+') || trimmedValue.startsWith('-')) {
    trimmedValue = trimmedValue.substring(1)
  }
  let expression = /\d+\.?\d+/
  if (!expression.test(trimmedValue)) {
    return `The value ${value} is not valid. A valid value should be a decimal number, optionally preceded by + or -.`
  }
}

function callOpenMaps(urlQuery) {
  // convert latitude value
  // example: " 48.4251378" (if '+' is sent in POST to this server)
  // example: "48.4251378"
  const lat = '+' + urlQuery["lat"].trim()

  const apiUrl = `http://openmaps.gov.bc.ca/geo/pub/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=pub%3AWHSE_ADMIN_BOUNDARIES.BCHA_CMNTY_HEALTH_SERV_AREA_SP&srsname=EPSG%3A4326&cql_filter=INTERSECTS(SHAPE%2CSRID%3D4326%3BPOINT(${urlQuery['long']}${lat}))&propertyName=CMNTY_HLTH_SERV_AREA_CODE%2CCMNTY_HLTH_SERV_AREA_NAME&outputFormat=application%2Fjson`
  const response = syncrequest('GET', apiUrl)
  const body = response.getBody('utf-8')
  if (!body || JSON.parse(body).totalFeatures == 0) {
    return "No result was found for the latitude and longitude values given."
  }
  return JSON.parse(body).features[0].properties['CMNTY_HLTH_SERV_AREA_NAME']
}

// function htmlResponse(responseText) {
//   return "<!DOCTYPE html>" +
//     "<html lang='en' dir='ltr'>" +
//     "  <head>" +
//     "    <meta charset='utf-8'>" +
//     "    <title>BC Community Health Service Area Finder</title>" +
//     "  </head>" +
//     "  <body>" +
//     "    <h2>" +
//     responseText +
//     "    </h2>" +
//     "  </body>" +
//     "</html>"
// }
// const hostname = '127.0.0.1';
// const port = 8000;
//
// const server = http.createServer((req, res) => {
//   res.statusCode = 200
//   res.setHeader('Content-Type', 'text/plain')
//   res.end('Hello, World!\n');
// })
//
// server.listen(port, hostname, () => {
//   console.log(`Server running at http://${hostname}:${port}/`)
// })

function incrementApiCallNumInDatabase() {
  const mysqlConnection = mysql.createConnection({
    host: 'db',
    port: 3306,
    user: 'root',
    password: process.env.MYSQL_ROOT_PASSWORD,
    database: process.env.MYQL_DATABASE
  })

  mysqlConnection.connect(function(err) {
    if (err) {
      console.error('error connecting: ' + err.stack)
      return;
    }
    console.log('connected as id ' + mysqlConnection.threadId)
  })
  mysqlConnection.query('UPDATE api_calls SET num_calls = num_calls + 1;', function(error, results, fields){
    if (error) {
      console.log(error)
    }
  })
  mysqlConnection.end()
}

const server = ronin.server()

server.use( '/bcapp', (req, res) => {
  incrementApiCallNumInDatabase()
  const urlQuery = url.parse(req.url, true).query
  const latErrorMessage = validate(urlQuery["lat"], "latitude")
  if (latErrorMessage) {
    return res.json({"error":latErrorMessage})
  }
  const longErrorMessage = validate(urlQuery["long"], "longitude")
  if (longErrorMessage) {
    return res.json({"error":longErrorMessage})
  }
  const result = callOpenMaps(urlQuery)
  return res.json({"CMNTY_HLTH_SERV_AREA_NAME": result})
})
server.start()
