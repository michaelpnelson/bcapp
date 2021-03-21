// TODO use https; resolve "SSL routines:ssl3_get_record:wrong version number"
const http = require('http')
const url = require('url')
const fetch = require('node-fetch')
const syncrequest = require('sync-request')
const ronin     = require( 'ronin-server' )
const mocks     = require( 'ronin-mocks' )
const database  = require( 'ronin-database' )
const server = ronin.server()

function validate(urlQuery) {
  if (!urlQuery["lat"]) {
    return "lat is missing"
  }
  if (!urlQuery["long"]) {
    return "long is missing"
  }
}

// const myUrl = "https://example.com";
//
// const get_data = async myUrl => {
//   try {
//     const response = await fetch(myUrl);
//     const json = await response.json();
//     return json
//   } catch (error) {
//     console.log(error);
//   }
// };

// getData(url);
function callOpenMaps(urlQuery) {
  // TODO this needs validation
  const lat = '+' + urlQuery["lat"].trim()
  // const fullPath = "http://openmaps.gov.bc.ca/geo/pub/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=pub%3AWHSE_ADMIN_BOUNDARIES.BCHA_CMNTY_HEALTH_SERV_AREA_SP&srsname=EPSG%3A4326&cql_filter=INTERSECTS(SHAPE%2CSRID%3D4326%3BPOINT(" + urlQuery["long"] + lat + "))&propertyName=CMNTY_HLTH_SERV_AREA_CODE%2CCMNTY_HLTH_SERV_AREA_NAME&outputFormat=application%2Fjson"
  // const request = new Request("https://www.google.com")

  const response = syncrequest('GET', 'https://www.google.com')
  const body = response.getBody('utf-8')
  return body
  // const blah
  // fetch("https://www.google.com")
  //   .then(response => response.text())
  //   .then(text => console.log(text))

  // const options = {
  //   hostname: 'openmaps.gov.bc.ca',
  //   port: 80,
  //   path: fullPath,
  //   method: 'GET'
  // }
  //
  // const req = http.request(options, res => {
  //   console.log(`statusCode: ${res.statusCode}`)
  //   res.setEncoding('utf8')
  //   const body = []
  //   res.on('data', d => {
  //     body.push(d)
  //     console.log(d)
  //   })
  //   console.log(body)
  // })
  //
  // req.on('error', error => {
  //   console.error(error)
  // })
  //
  // req.end()
}

database.connect( process.env.CONNECTIONSTRING )
server.use( '/foo', (req, res) => {
  return res.json({ "foo":"bar" })
})
server.use( '/bcapp', (req, res) => {
  const urlQuery = url.parse(req.url, true).query
  let errorMessage = validate(urlQuery)
  if (errorMessage) {
    return res.json({"error":errorMessage})
  }
  // const myResponse = get_data
  const result = callOpenMaps(urlQuery)
  // return result
  return res.json({"status": "done"})
})
server.use( '/', mocks.server( server.Router(), false, true ) )
server.start()
