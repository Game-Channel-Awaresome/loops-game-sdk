/**
 * Created by xiaoconglau on 05/09/2017.
 */
import { SDKConfig } from './config';

export const DevProxy = (function() {
  //let server_host = "https://apiloopstest.shabikplus.mozat.com";
  let server_host = 'http://localhost:8000/';
  let server_sig = '&sig=bf6b13bd37ec4173b7b075dc92bf989a';
  let zone_req = '&zone=sa';
  //let server_host = "http://192.168.128.62:2080";
  //POST
  let api_get_user = '/profile/bulk_query';
  let api_get_game_list = '/game/get_game_list';
  let api_get_broadcast_session = '/broadcast/session';
  let api_request_new_round = '/game/round/prepare';
  let api_start_new_round = '/game/round/start';
  let api_submit_result = '/game/round/end';
  let api_request_join_round = '/game/round/join';
  let api_send_in_game_data = '/game/game_msg/send';
  let api_game_broadcast = '/game/game_msg/broadcast';
  let api_extend = '/game/game_msg/extend';
  let sessionDatas = (function() {
    if (localStorage && localStorage.getItem(SDKConfig.LOCALSTORAGE_SESSION_DATA_KEY)) {
      return JSON.parse(localStorage.getItem(SDKConfig.LOCALSTORAGE_SESSION_DATA_KEY));
    } else {
      return { 'version': SDKConfig.VERSION };
    }

  })();
  let session_suffix = 'game-session-368-';

  /**
   * 获取一个会话数据。
   * @param key 是一个字符串
   */
  function getSessionDataImpl(key) {
    return sessionDatas[key];
  }

  function getSessionDatasImpl() {
    return sessionDatas;
  }

  /**
   * 向PK App 汇报当前已经游戏加载好了
   */
  function reportGameReadyImpl(gameId) {
    //window.PKJSBridge.call('reportGameReady', { "game_id": gameId });
  }

  /**
   * report to game that (server says) there's insufficient deposit on this user's account.
   * @param data is not in used yet, pass a {} is ok.
   */
  function reportInsufficientDepositImpl(data) {
    //window.PKJSBridge.call('reportInsufficientDeposit', data);
    alert('Client pop up top up dialog.')
  }

  /**
   * 向App 汇报当前游戏状态。
   * 注意 如果当前尚未准备好（requestNewRound 没有得到成功的返回），除 STATE_IDLE 之外的任何状态信息都不会被传递。
   */
  function reportGameStateImpl(stateId, stateData, stateTtl) {
    //window.PKJSBridge.call('reportState', { "state_id": stateId, "state_data": stateData, "state_ttl": stateTtl });
    if (window.broadcastTimeInterval) {
      clearInterval(window.broadcastTimeInterval);
    }
    window.broadcastTimeInterval = setInterval(() => {
      let url = server_host + api_game_broadcast + '?uid=' + getSessionDataImpl('user_id') + server_sig + zone_req;
      let requestData = genCommonRequestData();
      requestData.round_id = localStorage.getItem(SDKConfig.LOCALSTORAGE_ROUND_ID_KEY) || '';
      stateData.state_id = stateId;
      stateData.round_id = localStorage.getItem(SDKConfig.LOCALSTORAGE_ROUND_ID_KEY) || '';
      requestData.game_data = JSON.stringify(stateData);
      //console.log(JSON.stringify(requestData));
      fetch(url, {
        method: 'post',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      }).then(function(response) {
        return response.status == 200;
      }).then(function(success) {
        console.log('broadcast success');
      }).catch(function(err) {
        console.log('broadcast fail');
        console.log(err);
      });
    }, SDKConfig.BROADCAST_TIME_INTERVAL)
  }

  /**
   * 注册游戏状态更新
   * @param {Function} stateCallback(stateObj) stateObj 结构为 { "state_id":0, "state_data":{...} }
   */
  function registerGameStateChangedImpl(stateCallback) {
    //window.PKJSBridge.on('setState', stateCallback);
    window[SDKConfig.GLOBE_WATCHER_MESSAGE_CALLBACK_KEY] = {};
    window[SDKConfig.GLOBE_WATCHER_MESSAGE_CALLBACK_KEY].latestMessage = '';
    window[SDKConfig.GLOBE_WATCHER_MESSAGE_CALLBACK_KEY].callback = stateCallback;
  }

  /**
   * 批量获取用户信息
   * @param userIds 结构为 { "user_ids": [100001, 200003, 123456] }
   * @param {Function} getUsersCallback(users) users 结构是 {"users":[ {...}, {...}, ... ]}, 包含所请求的所有用户信息（只要是客户端能取到且允许的）。不保证users 里的顺序和userIds 的顺序相同。
   */
  function getUsersImpl(userIds, getUsersCallback) {
    let url = server_host + api_get_user + '?uid=' + getSessionDataImpl('user_id') + server_sig + zone_req;
    let _userIds = userIds;
    if (userIds.user_ids) {
      _userIds = userIds.user_ids;
    }
    fetch(url, {
      method: 'post',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uid: 100001, user_ids: _userIds }),
    }).then(function(response) {
      return response.json();
    }).then(function(data) {
      let gameData = genGameData(data);
      getUsersCallback(gameData);
    }).catch(function() {
      console.log('user profile error');
    });
  }

  /**
   * For HOST only.
   * @param data is the data to be sent, it should contain settings.
   * @param {Function} respCallback(respData) will be invoked when server responses.
   */
  function requestNewRoundImpl(data, respCallback) {
    //window.PKJSBridge.invoke('requestNewRound', data, respCallback);
    let url = server_host + api_request_new_round + '?uid=' + getSessionDataImpl('user_id') + server_sig + zone_req;
    let requestData = genCommonRequestData();
    requestData.setting = data;
    console.log(requestData);
    fetch(url, {
      method: 'post',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    }).then(function(response) {
      return response.json();
    }).then(function(data) {
      let gameData = genGameData(data);
      localStorage.setItem(SDKConfig.LOCALSTORAGE_ROUND_ID_KEY, gameData.data.round_id);
      console.log('requestNewRound');
      console.log(gameData);
      respCallback(gameData);
    }).catch(function(err) {
      console.log('requestNewRound error');
      console.log(err);
    });
  }

  function genGameData(apiData) {
    let gameData = {};
    gameData.code = 200;
    if (apiData instanceof Array) {
      gameData.array = apiData;
    } else if ((typeof apiData) == 'object') {
      gameData.data = apiData;
    } else {
      gameData.data = JSON.parse(apiData);
    }
    return gameData;
  }

  function genCommonRequestData() {
    let ret = {};
    ret.game_id = sessionDatas['game_id'];
    ret.host_id = sessionDatas['host_id'];
    ret.session_id = sessionDatas['session_id'];
    ret.round_id = localStorage.getItem(SDKConfig.LOCALSTORAGE_ROUND_ID_KEY) || '';
    return ret;
  }

  /**
   * For HOST only.
   * @param data is the data to be sent
   * @param {Function} respCallback(respData) will be invoked when server responses.
   */
  function requestRoundStartImpl(data, respCallback) {
    //window.PKJSBridge.invoke('requestStartARound', data, respCallback);
    let url = server_host + api_start_new_round + '?uid=' + getSessionDataImpl('user_id') + server_sig + zone_req;
    let requestData = genCommonRequestData();
    requestData.game_data = JSON.stringify(data);
    console.log(requestData);
    fetch(url, {
      method: 'post',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    }).then(function(response) {
      return response.json();
    }).then(function(data) {
      let gameData = genGameData(data);
      console.log('requestRoundStart');
      console.log(gameData);
      respCallback(gameData);
    }).catch(function(err) {
      console.log('requestRoundStart error');
      console.log(err);
    });
  }

  /**
   * For HOST only.
   * @param data is the data to be sent, it should contain bonus, etc
   * @param {Function} respCallback(respData) will be invoked when server responses.
   */
  function submitRoundResultImpl(data, respCallback) {
    //window.PKJSBridge.invoke('submitRoundResult', data, respCallback);
    let url = server_host + api_submit_result + '?uid=' + getSessionDataImpl('user_id') + server_sig + zone_req;
    let requestData = genCommonRequestData();
    requestData.game_data = JSON.stringify(data);
    console.log(requestData);
    fetch(url, {
      method: 'post',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    }).then(function(response) {
      return response.json();
    }).then(function(data) {
      let gameData = genGameData(data);
      console.log('submitRoundResult');
      console.log(gameData);
      respCallback(gameData);
    }).catch(function(err) {
      console.log('submitRoundResult error');
      console.log(err);
    });
  }

  /**
   * For NON-HOST only.
   * @param data is the data to be sent.
   * @param {Function} respCallback(respData) will be invoked when server responses.
   */
  function requestJoinARoundImpl(data, respCallback) {
    //window.PKJSBridge.invoke('requestJoinARound', data, respCallback);
    let url = server_host + api_request_join_round + '?uid=' + getSessionDataImpl('user_id') + server_sig + zone_req;
    let requestData = genCommonRequestData();
    requestData.user_id = sessionDatas['user_id'];
    console.log('join data:' + JSON.stringify(requestData));
    fetch(url, {
      method: 'post',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    }).then(function(response) {
      return response.json();
    }).then(function(data) {
      let gameData = genGameData(data);
      localStorage.setItem(SDKConfig.LOCALSTORAGE_ROUND_ID_KEY, gameData.data.round_id);
      console.log('requestJoinARound');
      console.log(gameData);
      respCallback(gameData);
    }).catch(function(err) {
      console.log('requestJoinARound error');
      respCallback(err);
    });
  }

  /**
   * Available for all.
   * @param data is the data to be sent.
   * @param {Function} respCallback(respData) will be invoked when server responses.
   */
  function requestExtendImpl(data, respCallback) {
    //window.PKJSBridge.invoke('requestExtend', data, respCallback);
    let url = server_host + api_extend + '?uid=' + getSessionDataImpl('user_id') + server_sig + zone_req;
    let requestData = genCommonRequestData();
    requestData.user_id = sessionDatas['user_id'];
    requestData.game_data = JSON.stringify(data);
    console.log(requestData);
    fetch(url, {
      method: 'post',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    }).then(function(response) {
      return response.json();
    }).then(function(data) {
      let gameData = genGameData(data);
      console.log('requestExtend');
      console.log(gameData);
      respCallback(gameData);
    }).catch(function(err) {
      console.log('requestExtend error');
      console.log(err);
    });
  }

  /**
   * Send the game's internal data to game-logic server.
   * @param data is the data to be sent.
   * @param {Function} respCallback(respData) will be invoked when server responses.
   */
  function requestSendInGameDataImpl(data, respCallback) {
    //window.PKJSBridge.invoke('requestSendInGameData', data, respCallback);
    let url = server_host + api_send_in_game_data + '?uid=' + getSessionDataImpl('user_id') + server_sig + zone_req;
    let requestData = genCommonRequestData();
    requestData.user_id = sessionDatas['user_id'];
    requestData.game_data = JSON.stringify(data);
    console.log(requestData);
    fetch(url, {
      method: 'post',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    }).then(function(response) {
      return response.json();
    }).then(function(data) {
      let gameData = genGameData(data);
      console.log('requestSendInGameData');
      console.log(gameData);
      respCallback(gameData);
    }).catch(function(err) {
      console.log('requestSendInGameData error');
      console.log(err);
    });
  }

  /**
   * display a toast.
   * @param text is the string to be displayed.
   */
  function toastImpl(text) {
    alert(text);
  }

  /**
   * Register a callback to handle incoming p2p message.
   * @param {Function} onP2pCallback(msgObj) , msgObj structure is { 'from':INT, 'target':INT, 'action':INT, 'msg_data':JSON }, 目前action 值有两个：P2PMESSAGE(100),JOIN(101)。
   */
  function registerOnP2pMsgImpl(onP2pCallback) {
    //window.PKJSBridge.on('p2pMsg', onP2pCallback);
    window[SDKConfig.GLOBE_HOST_MESSAGE_CALLBACK_KEY] = {};
    window[SDKConfig.GLOBE_HOST_MESSAGE_CALLBACK_KEY].latestMessage = '';
    window[SDKConfig.GLOBE_HOST_MESSAGE_CALLBACK_KEY].callback = onP2pCallback;
  }

  /**
   * 主app 跳转到指定页面。
   * @param url 为要跳转到的url。
   * @param closeThis 为一个int 值，默认为0，非0则表示跳转后关闭当前页面。
   */
  function openUrlImpl(url, closeThis) {
    //window.PKJSBridge.invoke('openUrl', { "url": url, "closeThis": closeThis });
  }

  function logToAppImpl(msg) {
    console.log(msg);
  }

  function mapWSDataToWatcher(data) {
    let ret = {};
    let gameData = JSON.parse(data.game_data);
    localStorage.setItem(SDKConfig.LOCALSTORAGE_ROUND_ID_KEY, gameData.round_id);
    ret.state_id = gameData.state_id;
    ret.state_data = gameData;
    return ret;
  }

  /**
   * 日志埋点。
   * @param data 为一个JSON Object, 里面包含要记录的内容。
   */
  function logToStatisticsImpl(data) {
    //window.PKJSBridge.call('logToStatistics', data);
    console.log('LOG:' + JSON.stringify(data));
  }

  /**
   * 请求关闭并释放当前webView。
   * @param txt 是一个字符串，供客户端在关闭webview 时弹出toast。
   */
  function closeWithMsgImpl(txt) {
    //window.PKJSBridge.call('closeWithMsg', { 'text': txt });
  }

  /**
   * 请求播放一条声音，并指定循环次数。
   * @param path 为声音完整路径，无须后缀名。如：/media/bgm
   * @param repeat 循环次数，repeat=1 表示一共播放 2 遍，0 表示不重复，-1 表示无限循环重复播放。
   * @param {Function} onPlayingCallback(playObj) 是一个回调，playObj 结构为 {'track_id':INT}, trackId 可用于调用 stopPlaying。
   */
  function playSoundImpl(path, repeat, onPlayingCallback) {
    //window.PKJSBridge.invoke('playSound', { 'sound_path': path, 'sound_repeat': repeat }, onPlayingCallback);
  }

  /**
   * 请求停止播放一个声音。
   * @param soundTrackId 为从 playSound 的回调中得到的 trackId。
   */
  function stopPlayingImpl(soundTrackId) {
    //window.PKJSBridge.call('stopPlaying', { 'track_id': soundTrackId });
  }

  /**
   * 通用接口。具体请求看请求的函数名。
   * @param name 为要请求的函数名。
   * @param data 为包含请求数据的json object，结构自由定义。
   * @param {Function} callbackFunc(callbackData) 是一个回调，callbackData 的类型和结构，每个调用可以自由定义。
   */
  function callHostAppImpl(name, data, callbackFunc) {
    let appData = { 'name': name, 'data': data };
    alert('call app  - data :' + JSON.stringify(appData));
    //window.PKJSBridge.invoke('callHostApp', { 'name': name, 'data': data }, callbackFunc);
  }

  function prepareDevelopEnvironmentImpl(callback) {
    window[SDKConfig.GLOBE_HOST_MESSAGE_CALLBACK_KEY] = {};
    let gameId = 1;
    if (sessionDatas && sessionDatas.game_id) {
      gameId = sessionDatas.game_id;
    }
    sessionDatas = { 'version': SDKConfig.VERSION };

    let div = document.createElement('div');
    div.id = 'sdk_setting';
    div.style.backgroundColor = '#fff';
    div.style.position = 'absolute';
    div.style.zIndex = 9999;
    div.style.top = 0;
    div.style.bottom = 0;
    div.style.left = 0;
    div.style.right = 0;
    let hostId = 200321;
    let watcherId = 191250;
    div.innerHTML = '<div id="game_setting" style="position:absolute;top:0;left:0;right:0;bottom:0;background-color: #fff"> <div id="sdk_identify_select" style="margin: 0 auto;width: 70%;text-align: center;margin-top: 80px"> <input type="radio" name="sdk_identify" value="0" checked>host <input type="radio" name="sdk_identify" value="1">watcher </div> <div id="sdk_game_id_wap" style="margin: 0 auto;width: 70%;text-align: center;margin-top: 20px"> <span style="display:inline-block;width: 80px;text-align: right">game id:</span> <input type="text" name="sdk_game_id" id="sdk_game_id" width="100px" height="30px" value="' + gameId + '" style="padding:5px;height:30px;border: 1px solid #000"/> </div> <div id="sdk_host_id_wap" style="margin: 0 auto;width: 70%;text-align: center;margin-top: 20px"> <span style="display:inline-block;width: 80px;text-align: right">host id:</span> <input type="text" name="sdk_host_id" id="sdk_host_id" width="100px" height="30px" value="' + hostId + '" style="padding:5px;height:30px;border: 1px solid #000"/> </div> <div id="sdk_watcher_id_wap" style="display:none;margin: 0 auto;width: 70%;text-align: center;margin-top: 20px"> <span style="display:inline-block;width: 80px;text-align: right">watcher id:</span> <input type="text" name="sdk_watcher_id" value="' + watcherId + '" id="sdk_watcher_id" width="100px" height="30px" style="padding:5px;height:30px;border: 1px solid #000"/> </div> <div id="option_user_jd_wrap" style="margin: 0 auto;width: 70%;text-align: center;margin-top: 20px"> 191273 180708 191250 </div> <div id="sdk_submit_wap" style="margin: 0 auto;width: 70%;text-align: center;margin-top: 20px"> <button id="sdk_submit" style="margin: 0 auto;margin-top: 20px;width: 50px;height: 30px;border: 1px solid #333;border-radius: 5px;background-color: #eee"> Start </button> </div> <div id="loading" style="display:none;position:absolute;top:0;left:0;right:0;bottom:0;background-color:rgba(255, 255, 255, 0.8)"> <img src="http://tradelinkiq.com/Images/ajax-spinner.gif" style="position:absolute;top:50%;left:50%;margin-left:-25px;margin-top:-25px;" width="50px" height="50px"/> </div> </div>';
    document.body.appendChild(div);

    let identifys = document.getElementsByName('sdk_identify');
    let hostIdWrap = document.getElementById('sdk_host_id_wap');
    let watcherIdWrap = document.getElementById('sdk_watcher_id_wap');
    let loading = document.getElementById('loading');
    //0 host, 1 watcher
    let identifyValue = 0;
    for (let i = 0; i < identifys.length; i++) {
      identifys[i].onclick = () => {
        let val = identifys[i].value;
        identifyValue = val;
        if (val === 0) {
          //host
          hostIdWrap.style.display = 'block';
          watcherIdWrap.style.display = 'none';
        } else {
          hostIdWrap.style.display = 'block';
          watcherIdWrap.style.display = 'block';
        }
      };
    }
    document.getElementById('sdk_submit').onclick = () => {
      loading.style.display = 'block';
      let hostId = document.getElementById('sdk_host_id').value;
      let watcherId = document.getElementById('sdk_watcher_id').value;
      let gameId = parseInt(document.getElementById('sdk_game_id').value);
      console.log('hostId:' + hostId);
      console.log('watcherId:' + watcherId);
      console.log('gameId:' + gameId);
      console.log('identifyValue:' + identifyValue);
      let isHost = identifyValue == 0;
      sessionDatas.game_id = gameId;
      sessionDatas.session_id = session_suffix + hostId;

      var webSocket = new WebSocket('ws://120.50.46.125:2048/ws?room=' + hostId);
      webSocket.onerror = function(err) {
        console.log('ws error:' + err);
      };
      webSocket.onmessage = function(data) {
        let wsData = data.data;
        //console.log(wsData);
        if (!sessionDatas.session_id && wsData.session_id) {
          sessionDatas.session_id = wsData.session_id;
          if (_isSessionDatasReady()) {
            localStorage.setItem(SDKConfig.LOCALSTORAGE_SESSION_DATA_KEY, JSON.stringify(sessionDatas));
            callback(true);
          }
        }
        if (isHost) {
          if (window[SDKConfig.GLOBE_HOST_MESSAGE_CALLBACK_KEY].callback
            && window[SDKConfig.GLOBE_HOST_MESSAGE_CALLBACK_KEY].latestMessage !== wsData) {
            let wsDataObj = JSON.parse(wsData);
            //todo move from and target logic to game side
            if (wsDataObj.msgType == 201) {
              wsDataObj.from = wsDataObj.user_id;
              wsDataObj.target = wsDataObj.host_id;
              if (wsDataObj.game_data) {
                wsDataObj.msg_data = JSON.parse(wsDataObj.game_data);
              }
              wsData = JSON.stringify(wsDataObj);
            }
            window[SDKConfig.GLOBE_HOST_MESSAGE_CALLBACK_KEY].latestMessage = wsData;
            window[SDKConfig.GLOBE_HOST_MESSAGE_CALLBACK_KEY].callback(JSON.parse(wsData));
          }
        } else {
          if (window[SDKConfig.GLOBE_WATCHER_MESSAGE_CALLBACK_KEY] && window[SDKConfig.GLOBE_WATCHER_MESSAGE_CALLBACK_KEY].callback
            && window[SDKConfig.GLOBE_WATCHER_MESSAGE_CALLBACK_KEY].latestMessage !== wsData) {
            if (JSON.parse(wsData).msgType !== 202) {
              //only handle broadcast message
              return;
            }
            window[SDKConfig.GLOBE_WATCHER_MESSAGE_CALLBACK_KEY].latestMessage = wsData;
            window[SDKConfig.GLOBE_WATCHER_MESSAGE_CALLBACK_KEY].callback(mapWSDataToWatcher(JSON.parse(wsData)));
          }
        }

      };

      if (identifyValue === 0) {
        //host
        sessionDatas.host_id = parseInt(hostId);
        sessionDatas.user_id = parseInt(hostId);
      } else {
        sessionDatas.host_id = parseInt(hostId);
        sessionDatas.user_id = parseInt(watcherId);
      }
      //fetch game setting
      let gameSettingUrl = server_host + api_get_game_list + '?uid=' + hostId + server_sig + zone_req;
      //gameSettingUrl = "https://api.github.com/users/github";
      fetch(gameSettingUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        },
        mode: 'cors',
        credentials: 'credentials',
        cache: 'default',
      }).then(function(response) {
        return response.json();
      }).then(function(data) {
          console.log('game setting');
          console.log(data);
          if (data && data.game_infos) {
            for (let i = 0; i < data.game_infos.length; i++) {
              let gameObj = data.game_infos[i];
              if (gameObj.id === gameId && gameObj.settings) {
                sessionDatas.game_settings = JSON.parse(gameObj.settings);
                break
              } else {
                sessionDatas.game_settings = {}
              }
            }
          }
          if (_isSessionDatasReady()) {
            document.body.removeChild(document.getElementById('sdk_setting'));
            localStorage.setItem(SDKConfig.LOCALSTORAGE_SESSION_DATA_KEY, JSON.stringify(sessionDatas));
            callback(true);
          }
        },
      ).catch(function(err) {
        console.log('game setting error');
      });


    };
  }

  function _isSessionDatasReady() {
    return sessionDatas && sessionDatas.user_id && sessionDatas.host_id && sessionDatas.game_id && sessionDatas.game_settings && sessionDatas.session_id;
  }

  return {
    prepareDevelopEnvironment: prepareDevelopEnvironmentImpl,

    /**
     * client api
     */
    getSessionData: getSessionDataImpl,
    openUrl: openUrlImpl,
    getSessionDatas: getSessionDatasImpl,
    reportGameReady: reportGameReadyImpl,
    reportInsufficientDeposit: reportInsufficientDepositImpl,
    toast: toastImpl,
    logToApp: logToAppImpl,
    logToStatistics: logToStatisticsImpl,
    closeWithMsg: closeWithMsgImpl,
    playSound: playSoundImpl,
    stopPlaying: stopPlayingImpl,
    callHostApp: callHostAppImpl,

    /**
     * platform api，include broadcast
     */
    getUsers: getUsersImpl,
    reportGameState: reportGameStateImpl,
    requestNewRound: requestNewRoundImpl,
    requestRoundStart: requestRoundStartImpl,
    submitRoundResult: submitRoundResultImpl,
    requestJoinARound: requestJoinARoundImpl,

    /**
     * socket listener
     */
    registerGameStateChanged: registerGameStateChangedImpl,
    registerOnP2pMsg: registerOnP2pMsgImpl,

    /**
     * game server
     */
    requestSendInGameData: requestSendInGameDataImpl,

    /**
     * extend
     */
    requestExtend: requestExtendImpl,
  };

}());