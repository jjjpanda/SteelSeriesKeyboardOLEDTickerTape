const request = require('request')
const fs = require('fs')

let address
try{
    address = `http://${JSON.parse(fs.readFileSync(process.env.PROGRAMDATA+'/SteelSeries/SteelSeries Engine 3/coreProps.json')).address}`
}
catch(e){
    address = "http://127.0.0.1:8080"
}
console.log(address)

let tickers
try{
    tickers = fs.readFileSync('./tickers.txt').toString().split(/\r\n|\n/)
}
catch(e){
    console.log('no tickers.txt file switching to defaults sorry')
    tickers = ['BTC-USD', "AMZN", "TSLA", "MSFT", "V", "SPY"]
}
tickers = tickers.map(ticker => {
    return {
        symbol: ticker,
        price: " "
    }
})
console.log(tickers, tickers.map(t => t.symbol).join(','))

const tickerRefresh = 10000
const screenRefresh = 250

let symbolString, priceString
let maxW 

let updateStrings = () => {
    maxW = 2 + Math.max.apply(Math, tickers.map(t => Math.max(t.symbol.length, t.price.length)))
    symbolString = ''
    priceString = ""
    for(const ticker of tickers){
        symbolString += ticker.symbol
        symbolString += " ".repeat(maxW - ticker.symbol.length)

        priceString += ticker.price
        priceString += " ".repeat(maxW - ticker.price.length)
    }
    console.log(symbolString)
    console.log(priceString)
}
updateStrings()

setInterval(() => {
    request('https://query1.finance.yahoo.com/v7/finance/quote',  {
        method: 'GET',
        qs: {
            symbols: tickers.map(t => t.symbol).join(',')
        }
    }, (err, res, body) => {
        if( err == null && res.statusCode == 200 ){
            body = JSON.parse(body)
            if(body != undefined && body.quoteResponse != undefined && body.quoteResponse.result != undefined){
                for(const quote of body.quoteResponse.result){
                    tickers.find(t => t.symbol === quote.symbol).price = `$${quote.regularMarketPreviousClose.toString()}`
                }
            }
            console.log(tickers)
            updateStrings()
        }
        else{
            console.log('stonk error', err)
        }
    })
    
}, tickerRefresh)

/* request(`${address}/bind_game_event`, {
    method: 'POST',
    json: true,
    'content-type': 'application/json',
    body: {
        "game": "BRUH",
        "event": "FN",
        "min_value": 0,
        "max_value": 100,
        "icon_id": 1,
        "handlers": [
          {
            "device-type": "keyboard",
            "zone": "function-keys",
            "color": {"gradient": {"zero": {"red": 255, "green": 0, "blue": 0},
                                   "hundred": {"red": 0, "green": 255, "blue": 0}}},
            "mode": "percent"
          }
        ]
      }
}) */

request(`${address}/bind_game_event`, {
    method: 'POST',
    json: true,
    'content-type': 'application/json',
    body: {
        "game": "BRUH",
        "event": "SCREEN",
        "handlers": [
          {
            "device-type": "keyboard",
            "zone": "one",
            "mode": "screen",
            'datas': [
                {
                    'lines': [
                        {
                            'has-text': true,
                            "context-frame-key": "first-line",
                        },
                        {
                            'has-text': true,
                            "context-frame-key": "second-line",
                        }
                    ]
                }
            ]
          }
        ]
      }
})

let stringIndex = 0

setInterval(() => {
    console.log('sending request')
    /* request(`${address}/game_event`, {
        method: 'POST',
        json: true,
        'content-type': 'application/json',
        body: {
            "game": "BRUH",
            "event": "FN",
            "data": {
                "value": Math.round(Math.random()* 100)
            }
        }
    }) */

    request(`${address}/game_event`, {
        method: 'POST',
        json: true,
        'content-type': 'application/json',
        body: {
            "game": "BRUH",
            "event": "SCREEN",
            "data": {
                "value": Math.round(Math.random()* 100),
                'frame': {
                    'first-line': symbolString.substring(stringIndex, stringIndex+20) + (symbolString.substring(stringIndex, stringIndex+20).length < 20 ? symbolString.substring(0, 20-symbolString.substring(stringIndex, stringIndex+20).length) : ""),
                    'second-line': priceString.substring(stringIndex, stringIndex+20) + (priceString.substring(stringIndex, stringIndex+20).length < 20 ? priceString.substring(0, 20-priceString.substring(stringIndex, stringIndex+20).length) : "")
                }
            }
        }
    }, (err, res, body) => {
        if(!err && res.statusCode == 200){
            console.log('should be good')
            stringIndex++ 
            if(stringIndex >= symbolString.length){
                stringIndex = 0 ;
            }
        }
        else{
            console.log('maybe bad')
        }
    })

}, screenRefresh)