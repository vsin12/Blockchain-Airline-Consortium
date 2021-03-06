const Web3 = require('web3')
const web3 = new Web3('http://127.0.0.1:7545')
const fs = require('fs');
const solc = require('solc');
let datetime = new Date();
const ObjectId = require('mongodb').ObjectID;
const bcrypt = require('bcrypt');
const express = require('express');
const bodyParser = require('body-parser')
const session = require('express-session');
const app = express();
var contract = require("truffle-contract");
var renderresult = false;
let add;
app.use(bodyParser());
app.use(express.static('public'));
app.set('view engine', 'ejs');
const MongoClient = require('mongodb').MongoClient
MongoClient.connect('mongodb+srv://vS12:npm123@cluster0-9p4gv.mongodb.net/Users?retryWrites=true', (err, database) => {
    if (err) return console.log(err)
    AirlineDb = database.db('AirlinesConsortium')
    AirlineDb.collection('Airlines').deleteMany({})
    AirlineDb.collection('AirlineSeatsCount').deleteMany({})
    AirlineDb.collection('ChangeRequests').deleteMany({})
    AirlineDb.collection('ConsortiumRequests').deleteMany({})
    AirlineDb.collection('ConsortiumResponses').deleteMany({})
    AirlineDb.collection('Users').deleteMany({})
    AirlineDb.collection('BookingFromUsers').deleteMany({})
    app.listen(3000, function() {})
})
web3.eth.getAccounts().then(

    function(addressObj) {
        var requestNumber = Math.floor(Math.random() * 10000);
        var responseNumber = Math.floor(Math.random() * 100000) + 10000;
        var showMsg = "";
        var messageFromAPI = "";
        var airlinesDropDown;
        var i = 0
        var chairPerson = addressObj[i];
        i++;
        var returnHash;
        var airlineName;
        var bookingId;

        const input = fs.readFileSync('Migrations.sol');
        const output = solc.compile(input.toString(), 1);
        const bytecode = output.contracts[':Migrations']['bytecode'];
        const abi = JSON.parse(output.contracts[':Migrations'].interface);


        var contract = new web3.eth.Contract(abi);
        contract.deploy({
                data: '0x' + bytecode,
            })
            .send({
                from: chairPerson,
                gas: 5500000,
                gasPrice: '2000000000000'
            })
            .on('receipt', (receipt) => {
                add = receipt.contractAddress;
                console.log(add)
            })

        console.log(add);

        app.get('/', (req, res) => {
            AirlineDb.collection('Users').find().toArray(function(err, results) {
                if (err) return console.log(err)
                res.render('home.ejs')
            })
        })

        app.get('/UnRegister', (req, res) => {
            res.render('UnRegister.ejs', {
                showMsg: showMsg,
                messageFromAPI: messageFromAPI
            })
            messageFromAPI = "";
            showMsg = "";
        })

        app.get('/userlogin', (req, res) => {
            AirlineDb.collection('Users').find().toArray(function(err, results) {
                if (err) return console.log(err)
                res.render('userlogin.ejs', {
                    showMsg: showMsg,
                    messageFromAPI: messageFromAPI
                })
                showMsg = "";
                messageFromAPI = "";
            })
        })

        app.get('/userRegistration', (req, res) => {
            query = {
                Status: "1"
            };
            AirlineDb.collection('Airlines').find(query).toArray(function(err, results) {
                res.render('userRegistration.ejs', {
                    drpdown: results,
                    showMsg: showMsg,
                    messageFromAPI: messageFromAPI
                })
                messageFromAPI = "";
                showMsg = "";
            })
        })

        app.get('/airlinerequests', (req, res) => {
            var query = {
                AirlineName: airlineName
            };
            AirlineDb.collection("Airlines").find(query).toArray(function(err, resu) {
                airlineName = resu[0].AirlineName;

                query = {
                    CurrentAirline: airlineName,
                    Status: {
                        $in: ["Pending", "Requested"]
                    }
                };
                AirlineDb.collection('ChangeRequests').find(query).toArray(function(err, results) {
                    query = {
                        RequestedToAirline: airlineName,
                        Status: {
                            $in: ["Pending"]
                        }
                    };
                    AirlineDb.collection('ConsortiumRequests').find(query).toArray(function(err, cresults) {
                        res.render('airlinePage.ejs', {
                            result: results,
                            numberOfPendingRequests: cresults.length,
                            showMsg: showMsg,
                            messageFromAPI: messageFromAPI
                        });
                        showMsg = "";
                        messageFromAPI = "";
                    })
                })
            })
        })

        app.get('/userBookings', (req, res) => {
            var query = {
                UserName: loggedInUser
            };
            AirlineDb.collection('BookingFromUsers').find(query).toArray(function(err, results) {
                res.render('userBookings.ejs', {
                    result: results,
                    airlinesDropDownejs: airlinesDropDown,
                    showMsg: showMsg,
                    messageFromAPI: messageFromAPI
                });
                showMsg = "";
                messageFromAPI = "";
            })
        })

        app.get('/consortiumRequests', (req, res) => {
            var query = {
                RequestedToAirline: airlineName,
                Status: "Pending"
            };
            AirlineDb.collection('ConsortiumRequests').find(query).toArray(function(err, results) {
                res.render('consortiumRequests.ejs', {
                    result: results,
                    numberOfPendingRequests: results.length,
                    showMsg: showMsg,
                    messageFromAPI: messageFromAPI
                });
                showMsg = "";
                messageFromAPI = "";
            })
        })

        app.get('/airlinesLogin', (req, res) => {
            res.render('airlinesLogin.ejs', {
                showMsg: showMsg,
                messageFromAPI: messageFromAPI
            });
            showMsg = "";
            messageFromAPI = "";
        })

        app.get('/Register', (req, res) => {
            res.render('index.ejs', {
                showMsg: showMsg,
                messageFromAPI: messageFromAPI
            });
            showMsg = "";
            messageFromAPI = "";
        })

        app.get('/UnRegisterUser', (req, res) => {
            res.render('UnRegisterUser.ejs', {
                showMsg: showMsg,
                messageFromAPI: messageFromAPI
            });
            showMsg = "";
            messageFromAPI = "";
        })


        app.post('/TransferRequest', (req, res) => {
            try {
                query = {
                    _id: ObjectId(req.body.inputBookingId)
                };
                AirlineDb.collection('ChangeRequests').find(query).toArray(function(err, changeRequestResults) {
                    var fromAddress = changeRequestResults[0].CurrentAirline;
                    var toAddress = changeRequestResults[0].RequestedAirline;
                    var requestedTo = toAddress
                    query = {
                        AirlineName: {
                            $in: [fromAddress, toAddress]
                        }
                    }
                    AirlineDb.collection('Airlines').find(query).toArray(function(err, airlinesResults) {
                        fromAddress = airlinesResults[0].airlineAddress;
                        toAddress = airlinesResults[1].airlineAddress;

                        //for checking modifiers//
                        // fromAddress='0x8bc45A7cC1Be921515d390Fc5cC9C19daf33faCf';  
                        contract.methods.registerRequest(fromAddress, toAddress, requestNumber).send({
                            from: fromAddress,
                            value: web3.utils.toWei('1.5', 'ether')
                        }).on('transactionHash', (hashResult) => {
                            requestNumber = requestNumber + 1;
                            var newTransferRequest = {
                                BookingId: req.body.inputBookingId,
                                RequestedByAirline: airlineName,
                                RequestedToAirline: requestedTo,
                                Createdtime: datetime,
                                Status: "Pending",
                                TransactionId: hashResult,
                                ResponseId: "",
                                RequestNumber: requestNumber
                            };
                            AirlineDb.collection('ConsortiumRequests').save(newTransferRequest, (err, result) => {
                                query = {
                                    _id: ObjectId(req.body.inputBookingId)
                                };
                                var newvalues = {
                                    $set: {
                                        Status: "Requested"
                                    }
                                };
                                AirlineDb.collection("ChangeRequests").updateOne(query, newvalues, function(err, resu) {
                                    res.redirect('/airlinerequests');
                                })
                            })
                        }).on('error', (err) => {
                            // show message
                            showMsg = "True";
                            messageFromAPI = "Invalid BookingId or Airline not registered on consortium";
                            res.redirect('/airlinerequests');
                        })
                    })
                })
            } catch (ex) {
                showMsg = "True";
                messageFromAPI = "Invalid BookingId or Airline not registered on consortium";
                res.redirect('/airlinerequests');
            }
        })

        app.post('/airlinesLogin', (req, res) => {
            var len;
            var val;
            var inputpassword = req.body.logininputPassword;
            var query = {
                AirlineId: req.body.logininputEmail
            };
            AirlineDb.collection("Airlines").find(query).toArray(function(err, resu) {
                if (resu != "") {
                    airlineName = resu[0].AirlineName;
                    var query = {
                        RequestedToAirline: airlineName,
                        Status: "Pending"
                    };
                    AirlineDb.collection('ConsortiumRequests').find(query).toArray(function(err, results) {
                        len = results.length;
                        query = {
                            CurrentAirline: airlineName,
                            Status: "Pending"
                        };
                        AirlineDb.collection('ChangeRequests').find(query).toArray(function(err, results) {
                            res.render('airlinePage.ejs', {
                                result: results,
                                numberOfPendingRequests: len,
                                showMsg: showMsg,
                                messageFromAPI: messageFromAPI
                            });
                        })
                    })
                } else {
                    showMsg = "True";
                    messageFromAPI = "Airline does not exist";
                    res.redirect('/airlinesLogin')
                }
            })
        })

        app.post('/userlogin', (req, res) => {

            AirlineDb.collection("Airlines").find().toArray(function(err, resu) {
                airlinesDropDown = resu;


                var returnValue;
                var inputpassword = req.body.logininputPassword;
                var query = {
                    Name: req.body.logininputEmail
                };
                AirlineDb.collection("Users").find(query).toArray(function(err, resu) {
                    if (resu != "") {
                        var query = {
                            UserName: req.body.logininputEmail
                        };
                        AirlineDb.collection("BookingFromUsers").find(query).toArray(function(err, resu) {
                            try {

                                loggedInUser = req.body.logininputEmail;

                                res.render('userBookings.ejs', {
                                    result: resu,
                                    airlinesDropDownejs: airlinesDropDown,
                                    showMsg: showMsg,
                                    messageFromAPI: messageFromAPI
                                });
                            } catch (ex) {
                                showMsg = "True";
                                messageFromAPI = "User does not exists";
                                res.redirect('/userlogin');
                            }
                        })

                    } else {
                        showMsg = "True";
                        messageFromAPI = "User does not exists";
                        res.redirect('/userlogin');
                    }
                });
            })
        })


        app.post('/changeRequest', (req, res) => {
            try {
                var query = {
                    _id: ObjectId(req.body.inputBookingId)
                };
                var newvalues = {
                    $set: {
                        Status: "Change Requested"
                    }
                };
                AirlineDb.collection("BookingFromUsers").find(query).toArray(function(err, resu) {
                    if (resu[0]._id == req.body.inputBookingId) {
                        var obj = resu;
                        AirlineDb.collection("BookingFromUsers").updateOne(query, newvalues, function(err, resu) {
                            try {} catch (ex) {}
                        })
                        //ChangeRequests
                        var newChangeRequest = {
                            BookingId: obj[0]._id,
                            CurrentAirline: obj[0].CurrentAirline,
                            RequestedAirline: req.body.inputAirline,
                            createdtime: datetime,
                            Status: "Pending",
                            PassengerId: obj[0].UserName
                        };
                        AirlineDb.collection('ChangeRequests').save(newChangeRequest, (err, result) => {
                            res.redirect('/userBookings');
                        })
                    } else {
                        showMsg = "True";
                        messageFromAPI = "Invalid Booking Id entered";
                        res.redirect('/userBookings');
                    }
                })
            } catch (ex) {
                showMsg = "True";
                messageFromAPI = "Invalid Booking Id entered";
                res.redirect('/userBookings');
            }
        })

        app.post('/UnRegisterUser', (req, res) => {
            var userAddress;
            query = {
                Name: req.body.logininputEmail
            }
            AirlineDb.collection("Users").find(query).toArray(function(err, result) {
                if (result != "") {
                    userAddress = result[0].userAddress;
                    newvalues = {
                        $set: {
                            Status: "0"
                        }
                    };
                    AirlineDb.collection("Users").updateOne(query, newvalues, function(err, result) {
                        contract.methods.UnregisterUser(userAddress).send({
                            from: userAddress
                        }).on('transactionHash', (hashResult) => {
                            showMsg = "True";
                            messageFromAPI = "User de-registered from consortium";
                            res.redirect('/UnRegisterUser');
                        })
                    })
                } else {
                    showMsg = "True";
                    messageFromAPI = "User not registered with consortium";
                    res.redirect('/UnRegisterUser');
                }
            })
        })

        app.post('/UnRegisterAirline', (req, res) => {
            var addressToUnRegister;
            query = {
                AirlineId: req.body.logininputEmail
            }
            AirlineDb.collection("Airlines").find(query).toArray(function(err, result) {
                if (result != "") {
                    addressToUnRegister = result[0].airlineAddress;
                    newvalues = {
                        $set: {
                            Status: "0"
                        }
                    };
                    AirlineDb.collection("Airlines").updateOne(query, newvalues, function(err, result) {
                        contract.methods.unregisterAirline(addressToUnRegister).send({
                            from: addressToUnRegister
                        }).on('transactionHash', (hashResult) => {
                            showMsg = "True"
                            messageFromAPI = "Airline de-registered from consortium";
                            res.redirect('/UnRegister');
                        })
                    })
                } else {
                    showMsg = "True"
                    messageFromAPI = "Airline not registered with the consortium";
                    res.redirect('/UnRegister');
                }
            })
        })

        app.post('/UserRegistration', (req, res) => {

            query = {
                Name: req.body.inputEmail
            };
            var useraddr = addressObj[i];
            AirlineDb.collection("Users").find(query).toArray(function(err, result) {
                if (result == "") {
                    i++;
                    contract.methods.registerUser(useraddr).send({
                        from: useraddr,
                        value: web3.utils.toWei('0.5', 'ether')
                    }).on('transactionHash', (hashResult) => {
                        var newUser = {
                            Name: req.body.inputEmail,
                            Password: req.body.inputPassword,
                            createdtime: datetime,
                            TransactionId: hashResult,
                            userAddress: useraddr,
                            Status: "1"
                        };
                        AirlineDb.collection('Users').save(newUser, (result) => {
                            var newBookingFromUser = {
                                Source: req.body.inputFlyingFrom,
                                Destination: req.body.inputFlyingTo,
                                CurrentAirline: req.body.inputAirline,
                                Status: "Confirmed",
                                UserName: req.body.inputEmail
                            };
                            AirlineDb.collection('BookingFromUsers').save(newBookingFromUser, (result) => {
                                showMsg = "True";
                                messageFromAPI = "User successfully registered";
                                res.redirect('/UserRegistration');
                            });
                        });
                    })
                } else {
                    showMsg = "True";
                    messageFromAPI = "User already exists or is de-registered from the consortium";
                    res.redirect('/UserRegistration');
                    //show validation message
                }
            })
        })

        app.post('/Register', (req, res) => {
            var hash = bcrypt.hashSync(req.body.inputPassword, 10);
            airlineAddress = addressObj[i];
            query = {
                AirlineName: req.body.inputAirlineName
            };
            AirlineDb.collection("Airlines").find(query).toArray(function(err, result) {
                if (result == "") {
                    i++;
                    contract.methods.registerAirline(airlineAddress).send({
                        from: airlineAddress,
                        value: web3.utils.toWei('2', 'ether')
                    }).on('transactionHash', (hashResult) => {
                        var newAirline = {
                            AirlineId: req.body.inputEmail,
                            password: hash,
                            AirlineName: req.body.inputAirlineName,
                            TotalSeats: req.body.inputNumberOfSeats,
                            Source: req.body.inputFlyingFrom,
                            Destination: req.body.inputFlyingTo,
                            createdtime: datetime,
                            TransactionId: hashResult,
                            airlineAddress: airlineAddress,
                            Status: "1"
                        };
                        AirlineDb.collection('Airlines').save(newAirline, (result) => {
                            var newAirlineSeatObj = {
                                AirlineName: req.body.inputAirlineName,
                                SeatsRemaining: req.body.inputNumberOfSeats,
                            };
                            AirlineDb.collection('AirlineSeatsCount').save(newAirlineSeatObj, (result) => {
                                showMsg = "True";
                                messageFromAPI = "Airline successfully Registered";
                                res.redirect('/Register');
                            });
                        });
                    })
                } else {
                    showMsg = "True";
                    messageFromAPI = "Airline already exists or it exists but is de-registered from the consortium";
                    res.redirect('/Register');
                    //show validation message
                }
            })
        })

        app.post('/VerifyAndApprove', (req, res) => {
            var bookingId = req.body.inputBookingId;
            var newvalues;
            var requestId;
            var responseId;
            var query = {
                BookingId: bookingId
            };
            AirlineDb.collection("ConsortiumRequests").find(query).toArray(function(err, result) {
                var toAddress = result[0].RequestedByAirline;
                var fromAddress = result[0].RequestedToAirline;
                query = {
                    AirlineName: {
                        $in: [fromAddress, toAddress]
                    }
                }
                AirlineDb.collection('Airlines').find(query).toArray(function(err, airlinesResults) {
                    toAddress = airlinesResults[0].airlineAddress;
                    fromAddress = airlinesResults[1].airlineAddress;
                    requestId = result[0]._id;
                    query = {
                        AirlineName: airlineName
                    };
                    AirlineDb.collection("AirlineSeatsCount").find(query).toArray(function(err, result) {
                        if (result[0].SeatsRemaining > 1) {
                            query = {
                                _id: ObjectId(bookingId)
                            };
                            newvalues = {
                                $set: {
                                    Status: "Confirmed"
                                }
                            };
                            AirlineDb.collection("BookingFromUsers").updateOne(query, newvalues, function(err, result) {
                                query = {
                                    _id: ObjectId(bookingId)
                                };
                                newvalues = {
                                    $set: {
                                        Status: "Confirmed"
                                    }
                                };
                                AirlineDb.collection("ChangeRequests").updateOne(query, newvalues, function(err, result) {
                                    AirlineDb.collection("ChangeRequests").find(query).toArray(function(err, result) {
                                        query = {
                                            _id: ObjectId(result[0].BookingId)
                                        };
                                        newvalues = {
                                            $set: {
                                                Status: "Confirmed",
                                                CurrentAirline: airlineName
                                            }
                                        };
                                        AirlineDb.collection("BookingFromUsers").updateOne(query, newvalues, function(err, result) {
                                            contract.methods.registerResponse(fromAddress, toAddress, responseNumber).send({
                                                from: fromAddress,
                                                value: web3.utils.toWei('1.5', 'ether')
                                            }).on('transactionHash', (hashResult) => {
                                                responseNumber = responseNumber + 1;
                                                var newResponse = {
                                                    RequestId: requestId,
                                                    TransactionId: hashResult,
                                                    Createdtime: datetime,
                                                    Response: "Confirmed",
                                                    ResponseNumber: responseNumber
                                                }

                                                AirlineDb.collection('ConsortiumResponses').save(newResponse, (err, result) => {
                                                    query = {
                                                        RequestId: requestId
                                                    };
                                                    AirlineDb.collection("ConsortiumResponses").find(query).toArray(function(err, result) {
                                                        query = {
                                                            _id: ObjectId(requestId)
                                                        };
                                                        newvalues = {
                                                            $set: {
                                                                ResponseId: result[0]._id,
                                                                Status: "Confirmed"
                                                            }
                                                        };
                                                        AirlineDb.collection("ConsortiumRequests").update(query, newvalues, function(err, result) {
                                                            var queryseat = {
                                                                AirlineName: airlineName
                                                            }
                                                            AirlineDb.collection("AirlineSeatsCount").find(queryseat).toArray(function(err, result) {
                                                                var newvaluesSeat = {
                                                                    $set: {
                                                                        SeatsRemaining: result[0].SeatsRemaining - 1
                                                                    }
                                                                };
                                                                AirlineDb.collection("AirlineSeatsCount").updateOne(queryseat, newvaluesSeat, function(err, result) {
                                                                    web3.eth.sendTransaction({
                                                                        from: fromAddress,
                                                                        to: toAddress,
                                                                        value: web3.utils.toWei('1', 'ether')
                                                                    }, function(error, hash) {});
                                                                    res.redirect('/consortiumRequests');
                                                                })
                                                            })
                                                        })
                                                    })
                                                })
                                            });
                                        })
                                    })
                                })
                            })
                        } else {
                            showMsg = "True";
                            messageFromAPI = "Invalid BookingId or Airline not registered on consortium";
                            res.redirect('/airlinerequests');
                        }
                    })
                })
            })
        })
    }
);
