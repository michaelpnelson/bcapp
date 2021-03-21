// const http = require('http')
const url = require('url')
const syncrequest = require('sync-request')
const ronin     = require( 'ronin-server' )
const mocks     = require( 'ronin-mocks' )
const database  = require( 'ronin-database' )
const mysql = require('mysql')

function validate(urlQuery) {
  // TODO validate data - regexp?
  // TODO break validation out to function taking a parameter
  if (!urlQuery["lat"]) {
    return "lat is missing"
  }
  if (!urlQuery["long"]) {
    return "long is missing"
  }
}

function callOpenMaps(urlQuery) {
  // TODO change input to omit "+" to avoid conversion
  // convert latitude value
  // example: " 48.4251378"
  const lat = '+' + urlQuery["lat"].trim()

  // TODO use a template
  const fullPath = "http://openmaps.gov.bc.ca/geo/pub/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=pub%3AWHSE_ADMIN_BOUNDARIES.BCHA_CMNTY_HEALTH_SERV_AREA_SP&srsname=EPSG%3A4326&cql_filter=INTERSECTS(SHAPE%2CSRID%3D4326%3BPOINT(" + urlQuery["long"] + lat + "))&propertyName=CMNTY_HLTH_SERV_AREA_CODE%2CCMNTY_HLTH_SERV_AREA_NAME&outputFormat=application%2Fjson"

  const response = syncrequest('GET', fullPath)
  const body = response.getBody('utf-8')
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

// database.connect( process.env.CONNECTIONSTRING )

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

const server = ronin.server()

const mysqlConnection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: process.env.MYSQL_ROOT_PASSWORD,
  database: process.env.MYQL_DATABASE
})

function incrementApiCallNumInDatabase() {
  mysqlConnection.connect()
  mysqlConnection.query('use bcapp; UPDATE api_calls SET num_calls = num_calls + 1;', function(error, results, fields){
    if (error) {
      console.log(error)
    }
  })
  mysqlConnection.end()
}

server.use( '/bcapp', (req, res) => {
  incrementApiCallNumInDatabase()
  const urlQuery = url.parse(req.url, true).query
  let errorMessage = validate(urlQuery)
  if (errorMessage) {
    return res.json({"error":errorMessage})
  }
  const result = callOpenMaps(urlQuery)
  return res.json({"CMNTY_HLTH_SERV_AREA_NAME": result})
})
server.use( '/', mocks.server( server.Router(), false, true ) )
server.start()
