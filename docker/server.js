const url = require('url')
const syncrequest = require('sync-request')
const ronin     = require( 'ronin-server' )
const mocks     = require( 'ronin-mocks' )
const database  = require( 'ronin-database' )
const server = ronin.server()

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
  // convert latitude value
  // example: " 48.4251378"
  const lat = '+' + urlQuery["lat"].trim()

  const fullPath = "http://openmaps.gov.bc.ca/geo/pub/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=pub%3AWHSE_ADMIN_BOUNDARIES.BCHA_CMNTY_HEALTH_SERV_AREA_SP&srsname=EPSG%3A4326&cql_filter=INTERSECTS(SHAPE%2CSRID%3D4326%3BPOINT(" + urlQuery["long"] + lat + "))&propertyName=CMNTY_HLTH_SERV_AREA_CODE%2CCMNTY_HLTH_SERV_AREA_NAME&outputFormat=application%2Fjson"

  const response = syncrequest('GET', fullPath)
  const body = response.getBody('utf-8')
  return JSON.parse(body).features[0].properties['CMNTY_HLTH_SERV_AREA_NAME']
}

database.connect( process.env.CONNECTIONSTRING )

server.use( '/bcapp', (req, res) => {
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
