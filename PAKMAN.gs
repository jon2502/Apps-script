function Pakman_data() {
  //API URL's needed for fetching data
  const URL1 = "https://Pakman.dk/APIV1/product"
  const URL2 = "https://pakman.dk/apiv1/Stock/"

  //get sheet
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = "sheetName"
  var sheet = ss.getSheetByName(sheetName);
  var headers;

  //check if sheet exist
  if (!sheet) {
        sheet = ss.insertSheet(sheetName);
        // Set headers
        headers = ["Name", "ProductNumber", "CostPrice", "Quantity", "TotalCostPrice"];
        sheet.appendRow(headers);
        sheet.setFrozenRows(1);
      }
      else {
        // If sheet exists, get headers from row 1
        headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      }

  // Get a JSON object that conmtains a list of all products
  productList = fetchAPI(URL1)
  //set up empty array for later
  var arr = []
  // parse the JSON data to make it a JS object
  var json = JSON.parse(productList.getContentText())
  //get the products array
  var jsondata = json.Data.Products

  //for each product run following lines
  for (data of jsondata){
    //fetch stock info on product
    productInfo = fetchAPI(URL2+data.Number)
    //parse the JSON object to JS object
    var json = JSON.parse(productInfo.getContentText())
    var jsondata = json.Data
    //the data needs to be paresed agin beacus of the way the returned data is set up.
    var parseData = JSON.parse(jsondata)
    // set data for quantity
    var quantity = parseData.Quantity
    // get total value of a product
    var total_Value = data.CostPrice*quantity

    //set up an array for the product and then push it to the empty array
    var obj = [data.Name, data.Number,data.CostPrice, quantity, total_Value]
    arr.push(obj);

  }
    //chect if array length is greater then 0
    if (arr.length > 0) {
        //insert the values from the array into the spradsheet. it must be an array since setVaules can only use data from a two-dimensional array of values.
        sheet.getRange(sheet.getLastRow() + 1, 1, arr.length, headers.length).setValues(arr);
      }
}

function fetchAPI (URL){
    // setup optins for API call
    const options = {
    'method': 'GET',
    'headers': {
    "PartnerToken": "insert own",
    "AccountToken": "insert own",
    'Content-Type': "application/x-www-form-urlencoded"
  }
  }
  //fetch API content
  const response = UrlFetchApp.fetch(URL, options)
  //retun response to function
  return response
}

function reset_data(){
  //get sheet
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("PAKMAN");
  //get everythin execpt the headers then clear it
  sheet.getRange(2,1,sheet.getLastRow(), sheet.getLastColumn()).clearContent();
  //get the data again
  Pakman_data()
}