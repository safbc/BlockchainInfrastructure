var express = require('express')
var bodyParser = require('body-parser')
var app = express()
var accountManagement = require('../AccountManagement/accountManagement.js');
var etherDistribution = require('../EtherDistribution/etherDistribution.js');
var contractIssuance = require('../Issuance/contractIssuance.js');
var contractRegistry = require('../DataAccess/contractRegistry.js');
var userRegistry = require('../DataAccess/userRegistry.js');

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

etherDistribution.StartEtherDistribution();

app.get('/getListOfContracts', function (req, res) {
	contractRegistry.GetListOfContracts(function(listOfContracts){
		res.json(listOfContracts);
	});
})

app.get('/getListOfUsers', function (req, res) {
	userRegistry.GetListOfUsers(function(listOfUsers){
		res.json(listOfUsers);
	});
})

app.post('/transferAsset', function (req, res) {
  var assetName = req.body.assetName;
  var amountToTransfer = req.body.amountToTransfer;
  var toAddress = req.body.toAddress;
  var userAddress = req.body.userAddress;
  var userPassword = req.body.userPassword;

  contractIssuance.Send(userAddress, userPassword, toAddress, assetName, amountToTransfer, function(txId){
    if(txId){
      res.json({'msg': 'succesfully transfered asset.  TxId: ', txId});
    } else {
      res.json({'err': 'There was an error transferring the asset'});
    }
  }); 
})

app.post('/login', function (req, res) {
  var userName = req.body.userName;
  var password = req.body.password;
  accountManagement.Login(userName, password, function(user){
    if(user){
      loggedInUser = user; 
        etherDistribution.AddAccountToWatch(loggedInUser.address, function(err){
					if(err){
						res.json({'err': 'There was an error accessing this account - please check that the blockchain node is running'});
					} else {
						res.json(user);
					}
        });
    } else {
      res.json({'err': 'invalid username or password'});
    }
  }); 
})

app.post('/registerNewUser', function(req, res){
  if(req.body){
		console.log('userName', req.body.userName);
		console.log('password', req.body.password);
		var userNameAndPassword = {
			name: req.body.userName,
			password: req.body.password
		};
		accountManagement.HandleUserRegistration(userNameAndPassword, function(user){
			if(user){
				res.json(user);
			} else {
				res.json({'err': 'That username is already registered on the system'});
			}
		});   
	} else {
		res.json({'err': 'There was nothing in the body'});
  }
});

app.post('/createAsset', function(req, res){
  if(req.body){
		console.log('assetName', req.body.assetName);
		console.log('initialIssuance', req.body.initialIssuance);
		console.log('userAddress', req.body.userAddress);
    contractIssuance.DeployToken(req.body.userAddress, req.body.assetName, req.body.initialIssuance, function(issuanceResult){
      if(issuanceResult){
        res.json(issuanceResult);
      } else {
        res.json({'msg': req.body.assetName + ' succesfully issued'});
      }
    });
  } else {
  res.json({'err': 'These was nothing in the body'});
  }
});

app.post('/getAssetBalance', function(req, res){
  if(req.body){
		console.log('assetName', req.body.assetName);
		console.log('userAddress', req.body.userAddress);
    contractIssuance.GetBalance(req.body.userAddress, req.body.assetName, function(balance){
      if(balance){
        res.json({'balance': balance.c[0]});
      } else {
        res.json({'err': 'No balance found for ' + req.body.assetName + ' and user address: ' + req.body.userAddress});
      }
    });
  } else {
  res.json({'err': 'These was nothing in the body'});
  }
});

app.listen(3032, function () {
    console.log('Springblock API running on port 3032')
})
