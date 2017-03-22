
"use strict";

var angular = require ('angular');

var settings = require ('settings');
require ('debug').enable (settings.debug);
var debug = require ('debug')('wyliodrin:lacy:FileExplorerController');

var path = require ('path');

var _ = require ('lodash');

var $ = require ('jquery');

var mixpanel = require ('mixpanel');

var library = require ('library');

var md5 = require('js-md5');

debug ('Loading');

module.exports = function ()
{

	var app = angular.module ('wyliodrinApp');

	app.controller('DeployController', function($scope, $timeout, $mdDialog, $wydevice, $translate){

		var that = this;

		var message = function (t, p)
		{
			if (t === 'dep')
			{
				$timeout ( function ()
					{
						if (p.a === 'ACK')
						{
							_.filter($scope.list, {hash:p.b})[0].busy = false;
							that.retake();
						}
						if (p.a === 'ls')
						{
							$scope.board = p.b;
							$scope.joinLists($scope.local, $scope.board);
						}
					});
			}
		};

		$scope.list=[];

		//list.away -> [{name status}]
		//list.here
		//list. here + away

		//hash ...
		//away TRUE FALSE
		//here TRUE FALSE
		//status RUNNING STOPPED ////////////////////ERROR(!!!!!!!!!!!!!!!!111111) in dau eu
		//busy TRUE FALSE

		$scope.local = [];
		//hash din title id date
		//supervisor_file

		//vedem
		$scope.board = [];

		$scope.getLocal = function(done)
		{
			$scope.listProjects(done);
		};

		$scope.getBoard = function()
		{
			$wydevice.send ('dep', {a:"ls"});
		};


		$scope.listProjects = function (done)
		{
			library.listProjects (function (err, list)
			{
				if (err)
				{
					debug ('Error list programs '+err);
				}
				else
				{
					$scope.local = list;
					$scope.$apply ();
					console.log(list);
				}
				if (done)
				{
					done(err);
				}
			});
		};

		$scope.stopped = function (obj)
		{
			if (obj.status == "STOPPED")
			{
				return true;
			}
			return false;
		};

		$scope.running = function (obj)
		{
			if (obj.status == "RUNNING")
			{
				return true;
			}
			return false;
		};

		function busy (obj, callback)
		{
			obj.busy = true;
			callback();
			//obj.busy = false;  done async
		}

		function joinLists(local, board)
		{
			$scope.makeHash($scope.local, ["title", "id", "date"]);

			_.each(local, function(local_proj)
			{
				local_proj.here = true;
			});

			_.each(board, function(board_proj)
			{
				board_proj.away = true;
			});

			_.each(local, function(local_proj)
			{
				var board_proj = _.find(board, {'hash': local_proj.hash});
				var proj = _.assign({},board_proj, local_proj);
				$scope.list.push(proj);
			});

			var local_rest = _.filter(local, function (local_proj)
			{
				if (_.find(board, {'hash':local_proj.hash}) === undefined){
					return true;
				}
				return false;
			});

			var board_rest = _.filter(board, function (board_proj)
			{
				if (_.find(local, {'hash':board_proj.hash}) === undefined){
					return true;
				}
				return false;
			});

			$scope.list = _.concat($scope.list, local_rest, board_rest);


			//////////////////////////////// sorting ceva
		}

		$scope.makeHash = function (list, elem)
		{
			_.each(list, function(proj)
			{
				var str = "";
				_.each(elem, function (e){
					str += proj[e]; //concating all needed
				});

				proj.hash = md5(str);
			});
		};

		function action (data, obj, act)
		{
			busy(obj, function (){
				$wydevice.send ('dep', {a:act,b:data});
			});
		}

		$scope.stop = function (obj)
		{
			action(obj.hash, obj, "stop");
		};

		$scope.run = function (obj)
		{
			action(obj.hash, obj, "run");
		};

		$scope.restart = function (obj)
		{
			action(obj.hash, obj, "restart");
		};

		$scope.deploy = function (obj)
		{
			obj.supervisor_file = "ceva aleator"; ///////////////////////////////////////////
			action(obj, obj, "deploy");
		};

		$scope.undeploy = function (obj)
		{
			action(obj.hash, obj, "undeploy");
		};

		$scope.redeploy = function (obj)
		{
			action(obj, obj, "redeploy");
		};

		$wydevice.on ('message', message);


		this.exit = function ()
		{
			$mdDialog.hide ();
		};

		this.retake = function ()
		{
			$scope.getLocal($scope.getBoard());
		};

		this.retake();



	});

};