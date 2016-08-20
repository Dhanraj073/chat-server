var express = require('express');
var app = express();
var server = require('http').Server(app);
var client= require('socket.io')(server);
var interact = require('interact-js');
var mongo = require('mongodb').MongoClient;
var port = process.env.PORT || 3030;

server.listen(port, function () {
//console.log('Updated : Server listening at port %d', port);
});
   

//routing
app.use('/js',  express.static(__dirname + '/public/js'));
app.use('/css', express.static(__dirname + '/public/css'));
app.use(express.static(__dirname + '/public'));


console.log('info - socket.io started');

var activeClientsId=[];             // storing socket_id of active user
var activeClientsUser=[];			// storing username corresponding to each active socket_id
var friends =[];


//connecting with the data base
mongo.connect('mongodb://127.0.0.1/chat', function(err, db) 
{
	if(err) 
	throw err;
	client.on('connection', function(socket) 
	{
		var col = db.collection('messages');
		var frn = db.collection('friends');
	//	console.log('a new connection ');
		
		var sendStatus = function(s) {
			socket.emit('status', s);
		};

		socket.on('disconnect', function() 
		{
		//	console.log(activeClientsId[socket.id], "user disconnected");
			//////////////////////////////////////
			//////////////////////////////////////
			//////////////////////////////////////
			frn.find({'dname': activeClientsId[socket.id]}).toArray(function(err,res)
			{
				if(err)
				throw err;
				for(var x=0;x<res.length;x++)
				{
					if(activeClientsUser[res[x].sname]!==undefined)
					{
					//	console.log(activeClientsId[res[x].sname]," 1223",res[x].sname);
						client.in(res[x].sname).emit('new_output1', res,0);
					}
				}

			});
			///////////////////////////////////////
			//////////////////////////////////
			///////////////////////////
			socket.leave(activeClientsId[socket.id]);
			delete activeClientsUser[activeClientsId[socket.id]];
			delete activeClientsId[socket.id];
		});
		//////////////////////////////////////
		/////////////////////////////////////
		////////////////////////////////////////
		socket.on('join',function(data)
		{
			
			socket.join(data.username);
		//	console.log(socket.id , 'new join');
			activeClientsId[socket.id]=data.username;
			activeClientsUser[data.username]=socket.id;

			//if there is a new join send the previous message to that user
			col.find({'dname':data.username},{sname:1,message:1,_id:0}).limit(100).sort({_id : 1}).toArray(function(err, res) 
			{
				if(err) 
				throw err;
				client.in(data.username).emit('output',res,0);
			
			});

			/// sending the status of each friend of that user 

			frn.find({'sname': data.username}).toArray(function(err,res)
			{
				if(err)
				throw err;
				var new_arr=[];
				for(var x=0;x<res.length;x++)
				{
					friends[data.username]=(res[x].dname);
					if(activeClientsUser[res[x].dname]===undefined)
					new_arr.push(0);
					else
					new_arr.push(1);
				//	console.log(res[x].dname,activeClientsId[res[x].dname],new_arr[x]);
				}
				client.in(data.username).emit('new_output',res,new_arr);
			});

			////////////////////////////////////////////////
			////////////////////////////////////////////////
			//sending the status to all friends of the user that I am online
			frn.find({'dname':data.username}).toArray(function(err,res){
				if(err)
				throw err;

				for(x=0;x<res.length;x++)
				{
					client.in(res[x].sname).emit('new_output2',res,1);
				}
			});

		});
		socket.on('input', function(data) 			
		{	
			
			//when a messgae is typed and sent to other user
			var name = data.name;
			var message = data.message;
			var time = "2016";
			var whitespacePattern = /^\s*$/;
			if (whitespacePattern.test(name) || whitespacePattern.test(message)) 
			sendStatus('Name and message is required');
			else
			{
				//inserting into database and sending it back to other user
				col.insert({'sname' : activeClientsId[socket.id], 'dname':name,'message' : message,status:"sent"}, function() 
				{
					if(activeClientsUser[name]!==undefined)
					{
					//	console.log(activeClientsId[socket.id], "user has sent the message");
						client.in(name).emit('output',[{'sname':activeClientsId[socket.id],'message':message}],0);
					}

					sendStatus({
						message : 'Message sent',
						clear : true
					});
				});

				//if that user is not in the friendlist add it in the database
				frn.find({"sname":String(activeClientsId[socket.id]),"dname":String(name)}).toArray(function(err,items){
					if(items.length===0)
					frn.insert({'sname' : activeClientsId[socket.id], 'dname':name});
				});
			}
		});

		//when user type the word Chart before a message

		socket.on('chart',function(data)
		{
			var i=0;
			for(i=0;i<data.message.length;i++)
			if(data.message[i]===':')
			break;

			//data is present as a string so it has to be converted to appropriate data type
			var str = data.message.substr(i+1,data.message.length-i);		

			//send the data to ne woutput div and also to the screen of sender
			if(activeClientsUser[data.name]!==undefined)
			{
				client.in(data.name).emit('output',str,1);
				setTimeout(function(){client.in(data.name).emit('output4',str);},2000);
			}
				
			else
			console.log("not getting socket_id");
		});
	});
});