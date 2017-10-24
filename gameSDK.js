/**!
 * 本文件对PK App 通过javascript 提供的功能进行了封装。
 * 使用方法：直接嵌入html5 页面，并注册相关的事件。
 * 主要功能有：
 * · 输出日志。
 * · 报告Game Ready。
 * · 向App 汇报当前游戏状态。
 * · 查询App 提供的session data，包括 gameId， userId, hostId……
 * · 等等。
 * 注意：所有功能都要在API 准备好以后才能进行，因此建议放到 onReady 回调里。
 *
 * @author Ken
 */

import { SDKConfig } from './config';
import { PublishProxy } from './publishProxy';
import { DevProxy } from './developProxy';

export var PkApi = (function() {

  'use strict';


  let mHostId = 0;
  let mMyUserId = 0;
  let diLogId = 100077;
  let enableDebugToDILog = (function() {
    if (window[SDKConfig.GLOBE_DEBUG_LOG_TO_DI_KEY]) {
      return true;
    } else {
      return false;
    }
  }());

  /**
   * 1 代表发布模式, 0 代表开发模式
   * @type {number}
   */
  let mDevelopMode = 0;
  /**
   * 0 视频流传送连接模式，1 直连模式
   * @type {number}
   */
  let mConnectMode = 0;
  let proxy = (function() {
    if (window[SDKConfig.GLOBE_MODE_KEY] && window[SDKConfig.GLOBE_MODE_KEY] == SDKConfig.MODE.DEVELOP) {
      return DevProxy;
    } else {
      return PublishProxy;
    }
  }());


  function initImpl(initObject) {
    mDevelopMode = initObject.developMode;
    mConnectMode = initObject.connectMode;
    window[SDKConfig.GLOBE_DEBUG_LOG_TO_DI_KEY] = initObject.enableDebugToDILog;
    enableDebugToDILog = initObject.enableDebugToDILog;
    window[SDKConfig.GLOBE_MODE_KEY] = initObject.developMode;
    if (initObject.developMode == SDKConfig.MODE.DEVELOP) {
      proxy = DevProxy;
    } else {
      proxy = PublishProxy;
    }
  }


  /**
   * 当API 准备好后执行，使用方法：
   * PKApi.ready(function(Api){
     *     // 参数中的Api，即是PKApi 对象
     * });
   * @param readyCallback
   */
  function onPKJsBridgeReady(readyCallback) {
    console.log("sdk connect model:" + mConnectMode + ", develop model:" + mDevelopMode);
    if (mDevelopMode == SDKConfig.MODE.DEVELOP) {
      proxy.prepareDevelopEnvironment((success) => {
        if (success) {
          readyCallback(this);
        }
      });
      return;
    }
    if (readyCallback && typeof readyCallback == 'function') {
      var Api = this;
      var pkReadyFunc = function() {
        mMyUserId = Api.getSessionData('user_id');
        mHostId = Api.getSessionData('host_id');

        readyCallback(Api);
      };

      if (typeof window.PKJSBridge == 'undefined') {
        if (document.addEventListener) {
          document.addEventListener('PKJSBridgeReady', pkReadyFunc, false);
        } else if (document.attachEvent) {
          document.attachEvent('PKJSBridgeReady', pkReadyFunc);
          document.attachEvent('onPKJSBridgeReady', pkReadyFunc);
        } else {
          console.error('====== unable to attachEvent ======');
        }
      } else {
        pkReadyFunc();
      }
    }
  }

  function debugLogToDI(type, action, rdata) {
    if (!enableDebugToDILog) return;
    let data = {};
    data.id = diLogId;
    data.type = type;
    data.action = action;
    data.ts = Date.now();
    if (type == SDKConfig.DI.REQUEST_TYPE) {
      data.requestData = rdata;
    } else {
      data.responseData = rdata;
    }
    if (proxy.getSessionData("game_id")) {
      data.gameId = proxy.getSessionData("game_id");
    }
    proxy.logToStatistics(data);
  }

  return {
    version: "2.0",
    /**
     * start entrance
     */
    onReady: onPKJsBridgeReady,
    /**
     * sdk relative
     */
    init: initImpl,
    prepareDevelopEnvironment: (callback) => {
      proxy.prepareDevelopEnvironment(callback);
    },
    /**
     * client api
     */
    getSessionData: (key) => {
      debugLogToDI(SDKConfig.DI.REQUEST_TYPE, "getSessionData", key);
      debugLogToDI(SDKConfig.DI.RESPONSE_TYPE, "getSessionData", proxy.getSessionData(key));
      return proxy.getSessionData(key)
    },
    openUrl: (url, closeThis) => {
      let rData = { "url": url, "closeThis": closeThis };
      debugLogToDI(SDKConfig.DI.REQUEST_TYPE, "openUrl", rData);
      proxy.openUrl(url, closeThis)
    },
    getSessionDatas: () => {
      return proxy.getSessionDatas()
    },
    reportGameReady: (gameId) => {
      debugLogToDI(SDKConfig.DI.REQUEST_TYPE, "reportGameReady", gameId);
      proxy.reportGameReady(gameId)
    },
    reportInsufficientDeposit: (data) => {
      debugLogToDI(SDKConfig.DI.REQUEST_TYPE, "reportInsufficientDeposit", data);
      proxy.reportInsufficientDeposit(data)
    },
    toast: (text) => {
      debugLogToDI(SDKConfig.DI.REQUEST_TYPE, "toast", text);
      proxy.toast(text)
    },
    logToApp: (msg) => {
      proxy.logToApp(msg)
    },
    logToStatistics: (data) => {
      proxy.logToStatistics(data)
    },
    closeWithMsg: (msg) => {
      debugLogToDI(SDKConfig.DI.REQUEST_TYPE, "closeWithMsg", msg);
      proxy.closeWithMsg(msg)
    },
    playSound: (path, repeat, onPlayingCallback) => {
      let rData = { 'sound_path': path, 'sound_repeat': repeat };
      debugLogToDI(SDKConfig.DI.REQUEST_TYPE, "playSound", rData);
      proxy.playSound(path, repeat, function(data) {
        debugLogToDI(SDKConfig.DI.RESPONSE_TYPE, "playSound", data);
        onPlayingCallback(data);
      });

    },
    stopPlaying: (soundTrackId) => {
      let rData = { 'track_id': soundTrackId };
      debugLogToDI(SDKConfig.DI.REQUEST_TYPE, "stopPlaying", rData);
      proxy.stopPlaying(soundTrackId)
    },
    callHostApp: (name, data, callbackFunc) => {
      let rData = { 'name': name, 'data': data };
      debugLogToDI(SDKConfig.DI.REQUEST_TYPE, "callHostApp", rData);
      proxy.callHostApp(name, data, function(data) {
        debugLogToDI(SDKConfig.DI.RESPONSE_TYPE, "callHostApp", data);
        callbackFunc(data);
      });
    },
    /**
     * platform api，include broadcast
     */
    getUsers: (userIds, getUsersCallback) => {
      debugLogToDI(SDKConfig.DI.REQUEST_TYPE, "getUsers", userIds);
      proxy.getUsers(userIds, function(data) {
        debugLogToDI(SDKConfig.DI.RESPONSE_TYPE, "getUsers", data);
        getUsersCallback(data);
      })
    },
    reportGameState: (stateId, stateData, stateTtl) => {
      let rData = { 'state_id': stateId, 'state_data': stateData, 'state_ttl': stateTtl };
      debugLogToDI(SDKConfig.DI.REQUEST_TYPE, "reportGameState", rData);
      proxy.reportGameState(stateId, stateData, stateTtl)
    },
    requestNewRound: (data, respCallback) => {
      debugLogToDI(SDKConfig.DI.REQUEST_TYPE, "requestNewRound", data);
      proxy.requestNewRound(data, function(res) {
        debugLogToDI(SDKConfig.DI.RESPONSE_TYPE, "requestNewRound", res);
        respCallback(res);
      })
    },
    requestRoundStart: (data, respCallback) => {
      debugLogToDI(SDKConfig.DI.REQUEST_TYPE, "requestRoundStart", data);
      proxy.requestRoundStart(data, function(res) {
        debugLogToDI(SDKConfig.DI.RESPONSE_TYPE, "requestRoundStart", res);
        respCallback(res);
      })
    },
    submitRoundResult: (data, respCallback) => {
      debugLogToDI(SDKConfig.DI.REQUEST_TYPE, "submitRoundResult", data);
      proxy.submitRoundResult(data, function(res) {
        debugLogToDI(SDKConfig.DI.RESPONSE_TYPE, "submitRoundResult", res);
        respCallback(res);
      })
    },
    requestJoinARound: (data, respCallback) => {
      debugLogToDI(SDKConfig.DI.REQUEST_TYPE, "requestJoinARound", data);
      proxy.requestJoinARound(data, function(res) {
        debugLogToDI(SDKConfig.DI.RESPONSE_TYPE, "requestJoinARound", res);
        respCallback(res);
      })
    },

    /**
     * socket listener
     */
    registerGameStateChanged: (callback) => {
      proxy.registerGameStateChanged(function(data) {
        debugLogToDI(SDKConfig.DI.RESPONSE_TYPE, "registerGameStateChanged", data);
        callback(data)
      })
    },
    registerOnP2pMsg: (callback) => {
      proxy.registerOnP2pMsg(function(data) {
        debugLogToDI(SDKConfig.DI.RESPONSE_TYPE, "registerOnP2pMsg", data);
        callback(data)
      })
    },

    /**
     * game server
     */
    requestSendInGameData: (data, respCallback) => {
      debugLogToDI(SDKConfig.DI.REQUEST_TYPE, "requestSendInGameData", data);
      proxy.requestSendInGameData(data, function(res) {
        debugLogToDI(SDKConfig.DI.RESPONSE_TYPE, "requestSendInGameData", res);
        respCallback(res);
      })
    },

    /**
     * extend
     */
    requestExtend: (data, respCallback) => {
      debugLogToDI(SDKConfig.DI.REQUEST_TYPE, "requestExtend", data);
      proxy.requestExtend(data, function(res) {
        debugLogToDI(SDKConfig.DI.RESPONSE_TYPE, "requestExtend", res);
        respCallback(res);
      })
    },
  }
})();
