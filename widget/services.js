(function (angular, buildfire, location) {
    'use strict';
    //created mediaCenterWidget module
    var settings, appId;
    var Settings = {
        setSettings: function (newSettings) {
            settings = newSettings;
        },
        setAppId: function (newId) {
            appId = newId;
        },
        getSetting: function () {
            return settings;
        },
        getAppId: function () {
            return appId;
        }
    };
    angular
        .module('placesWidgetServices', ['placesEnums'])
        .provider('Buildfire', [function () {
            this.$get = function () {
                return buildfire;
            };
        }])
        .provider('Messaging', [function () {
            this.$get = function () {
                return buildfire.messaging;
            };
        }])
        .provider('ImageLib', [function () {
            this.$get = function () {
                return buildfire.imageLib;
            };
        }])
        .factory('Location', [function () {
            var _location = location;
            return {
                go: function (path) {
                    _location.href = path;
                },
                goToHome: function () {
                    _location.href = _location.href.substr(0, _location.href.indexOf('#'));
                }
            };
        }])
        .factory('Orders', [function () {
            var ordersMap = {
                Manually: "Manually",
                Default: "Manually",
                Newest: "Newest",
                Oldest: "Oldest",
                SectionAZ: "Section Name A-Z",
                SectionZA: "Section Name Z-A"
            };
            var orders = [
                {id: 1, name: "Manually", value: "Manually", key: "rank", order: 1},
                {id: 1, name: "Newest", value: "Newest", key: "dateCreated", order: -1},
                {id: 1, name: "Oldest", value: "Oldest", key: "dateCreated", order: 1},
                {id: 1, name: "Section Name A-Z", value: "Section Name A-Z", key: "secTitle", order: 1},
                {id: 1, name: "Section Name Z-A", value: "Section Name Z-A", key: "secTitle", order: -1}
            ];
            return {
                ordersMap: ordersMap,
                options: orders,
                getOrder: function (name) {
                    return orders.filter(function (order) {
                        return order.name === name;
                    })[0];
                }
            };
        }])
        .factory('OrdersItems', [function () {
            var ordersMap = {
                Manually: "Manually",
                Default: "Newest",
                Newest: "Newest",
                Oldest: "Oldest",
                ItemAZ: "Item A-Z",
                ItemZA: "Item Z-A"
            };
            var orders = [
                {id: 1, name: "Manually", value: "Manually", key: "rank", order: 1},
                {id: 1, name: "Newest", value: "Newest", key: "dateCreated", order: -1},
                {id: 1, name: "Oldest", value: "Oldest", key: "dateCreated", order: 1},
                {id: 1, name: "ItemA-Z", value: "Item A-Z", key: "itemTitle", order: 1},
                {id: 1, name: "ItemZ-A", value: "Item Z-A", key: "itemTitle", order: -1}
            ];
            return {
                ordersMap: ordersMap,
                options: orders,
                getOrder: function (name) {
                    return orders.filter(function (order) {
                        return order.name === name;
                    })[0];
                }
            };
        }])
        .factory("DB", ['Buildfire', '$q', 'MESSAGES', 'CODES', function (Buildfire, $q, MESSAGES, CODES) {
            function DB(tagName) {
                this._tagName = tagName;
            }

            DB.prototype.get = function () {
                var that = this;
                var deferred = $q.defer();
                Buildfire.datastore.get(that._tagName, function (err, result) {
                    if (err && err.code == CODES.NOT_FOUND) {
                        return deferred.resolve();
                    }
                    else if (err) {
                        return deferred.reject(err);
                    }
                    else {
                        return deferred.resolve(result);
                    }
                });
                return deferred.promise;
            };
            DB.prototype.getById = function (id) {
                var that = this;
                var deferred = $q.defer();
                Buildfire.datastore.getById(id, that._tagName, function (err, result) {
                    if (err) {
                        return deferred.reject(err);
                    }
                    else if (result && result.data) {
                        return deferred.resolve(result);
                    } else {
                        return deferred.reject(new Error(MESSAGES.ERROR.NOT_FOUND));
                    }
                });
                return deferred.promise;
            };
            DB.prototype.find = function (options) {
                var that = this;
                var deferred = $q.defer();
                if (typeof options == 'undefined') {
                    return deferred.reject(new Error(MESSAGES.ERROR.OPTION_REQUIRES));
                }
                Buildfire.datastore.search(options, that._tagName, function (err, result) {
                    if (err) {
                        return deferred.reject(err);
                    }
                    else if (result) {
                        return deferred.resolve(result);
                    } else {
                        return deferred.reject(new Error(MESSAGES.ERROR.NOT_FOUND));
                    }
                });
                return deferred.promise;
            };

            return DB;
        }])
        .value('Settings', Settings)
        .factory("AppConfig", ['$rootScope', 'Buildfire', 'Settings', function ($rootScope, Buildfire, Settings) {
            return {
                setSettings: function (newSettings) {
                    Settings.setSettings(newSettings);
                },
                setAppId: function (newAppId) {
                    Settings.setAppId(newAppId);
                },
                getSettings: function () {
                    return Settings.getSetting();
                },
                getAppId: function () {
                    return Settings.getAppId();
                },
                changeBackgroundTheme: function (url) {
                }
            };
        }])
        .factory('GeoDistance', ['$q', '$http', function ($q, $http) {
            var _getDistance = function (origin, items, distanceUnit) {
                var deferred = $q.defer();
                var originMap;
                if(origin && origin.length)
                    originMap= {lat: origin[1], lng: origin[0]};
                else{
                    originMap={lat:37.33,lng:121.88};
                }
                var destinationsMap = [];

                if (!origin || !Array.isArray(origin)) {
                    deferred.reject({
                        code: 'NOT_ARRAY',
                        message: 'origin is not an Array'
                    });
                }
                if (!items || !Array.isArray(items) || !items.length) {
                    deferred.reject({
                        code: 'NOT_ARRAY',
                        message: 'destinations is not an Array'
                    });
                }

                items.forEach(function (_dest) {
                    if (_dest.data && _dest.data.address && _dest.data.address.lat && _dest.data.address.lng)
                        destinationsMap.push({lat: _dest.data.address.lat, lng: _dest.data.address.lng});
                    else
                        destinationsMap.push({lat: 0, lng: 0});
                });

                var service = new google.maps.DistanceMatrixService;
                service.getDistanceMatrix({
                    origins: [originMap],
                    destinations: destinationsMap,
                    travelMode: google.maps.TravelMode.DRIVING,
                    unitSystem: distanceUnit == 'kilometers' ? google.maps.UnitSystem.METRIC : google.maps.UnitSystem.IMPERIAL,
                    avoidHighways: false,
                    avoidTolls: false
                }, function (response, status) {
                    if (status !== google.maps.DistanceMatrixStatus.OK) {
                        deferred.reject(status);
                    } else {
                        deferred.resolve(response);
                    }
                });
                return deferred.promise;
            };
            return {
                getDistance: _getDistance
            }
        }]);
})(window.angular, window.buildfire, window.location);