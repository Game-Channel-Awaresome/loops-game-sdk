/**
 * Created by xiaoconglau on 05/09/2017.
 */
/**
 * Created by xiaoconglau on 05/09/2017.
 */
export var PublishProxy = (function() {
  'use strict';

  // constants
  var STATE_IDLE = 0;
  var STATE_PREPARING = STATE_IDLE + 1;
  var STATE_RESULT = 255;
  var SYSTEM_STATE_TTL = 10000;// 10 seconds
  // end of const

  var mHostId = 0;
  var mMyUserId = 0;

  /**
   * 当API 准备好后执行，使用方法：
   * PKApi.ready(function(Api){
     *     // 参数中的Api，即是PKApi 对象
     * });
   * @param readyCallback
   */
  function onPKJsBridgeReady(readyCallback) {
    if (readyCallback && typeof readyCallback === 'function') {
      var Api = this;
      var pkReadyFunc = function() {
        mMyUserId = Api.getSessionData('user_id');
        mHostId = Api.getSessionData('host_id');

        readyCallback(Api);
      };
      if (typeof window.PKJSBridge === 'undefined') {
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

  /**
   * 注册一个回调，当PK 游戏页面离开屏幕的时候回调
   */
  function onPKJsSysPause(pauseCallback) {
    window.PKJSBridge.on('sys:onpause', pauseCallback);
  }

  /**
   * 注册一个回调，当PK 游戏页面重新回到屏幕的时候回调
   */
  function onPKJsSysResume(resumeCallback) {
    window.PKJSBridge.on('sys:onresume', resumeCallback);
  }

  /**
   * 获取一个会话数据。
   * @param key 是一个字符串
   */
  function getSessionDataImpl(key) {
    return window.PKJSBridge.env(key);
  }

  function getSessionDatasImpl() {
    return window.PKJSBridge.session_datas();
  }

  /**
   * 向PK App 汇报当前已经游戏加载好了
   */
  function reportGameReadyImpl(gameId) {
    window.PKJSBridge.call('reportGameReady', { 'game_id': gameId });
  }

  /**
   * report to game that (server says) there's insufficient deposit on this user's account.
   * @param data is not in used yet, pass a {} is ok.
   */
  function reportInsufficientDepositImpl(data) {
    window.PKJSBridge.call('reportInsufficientDeposit', data);
  }

  /**
   * 向App 汇报当前游戏状态。
   * 注意 如果当前尚未准备好（requestNewRound 没有得到成功的返回），除 STATE_IDLE 之外的任何状态信息都不会被传递。
   */
  function reportGameStateImpl(stateId, stateData, stateTtl) {
    window.PKJSBridge.call('reportState', { 'state_id': stateId, 'state_data': stateData, 'state_ttl': stateTtl });
  }

  /**
   * 注册游戏状态更新
   * @param {Function} stateCallback(stateObj) stateObj 结构为 { "state_id":0, "state_data":{...} }
   */
  function registerGameStateChangedImpl(stateCallback) {
    window.PKJSBridge.on('setState', stateCallback);
  }

  /**
   * 批量获取用户信息
   * @param userIds 结构为 { "user_ids": [100001, 200003, 123456] }
   * @param {Function} getUsersCallback(users) 包含所请求的所有用户信息（只要是客户端能取到且允许的）。不保证users 里的顺序和userIds 的顺序相同。
   */
  function getUsersImpl(userIds, getUsersCallback) {
    window.PKJSBridge.invoke('getUsers', userIds, getUsersCallback);
  }

  /**
   * For HOST only.
   * @param data is the data to be sent, it should contain settings.
   * @param {Function} respCallback(respData) will be invoked when server responses.
   */
  function requestNewRoundImpl(data, respCallback) {
    window.PKJSBridge.invoke('requestNewRound', data, respCallback);
  }

  /**
   * For HOST only.
   * @param data is the data to be sent
   * @param {Function} respCallback(respData) will be invoked when server responses.
   */
  function requestRoundStartImpl(data, respCallback) {
    window.PKJSBridge.invoke('requestStartARound', data, respCallback);
  }

  /**
   * For HOST only.
   * @param data is the data to be sent, it should contain bonus, etc
   * @param {Function} respCallback(respData) will be invoked when server responses.
   */
  function submitRoundResultImpl(data, respCallback) {
    window.PKJSBridge.invoke('submitRoundResult', data, respCallback);
  }

  /**
   * For NON-HOST only.
   * @param data is the data to be sent.
   * @param {Function} respCallback(respData) will be invoked when server responses.
   */
  function requestJoinARoundImpl(data, respCallback) {
    window.PKJSBridge.invoke('requestJoinARound', data, respCallback);
  }

  /**
   * Available for all.
   * @param data is the data to be sent.
   * @param {Function} respCallback(respData) will be invoked when server responses.
   */
  function requestExtendImpl(data, respCallback) {
    window.PKJSBridge.invoke('requestExtend', data, respCallback);
  }

  /**
   * Send the game's internal data to game-logic server.
   * @param data is the data to be sent.
   * @param {Function} respCallback(respData) will be invoked when server responses.
   */
  function requestSendInGameDataImpl(data, respCallback) {
    window.PKJSBridge.invoke('requestSendInGameData', data, respCallback);
  }

  /**
   * display a toast.
   * @param text is the string to be displayed.
   */
  function toastImpl(text) {
    window.PKJSBridge.call('toast', { 'text': text });
  }

  /**
   * Register a callback to handle incoming p2p message.
   * @param {Function} onP2pCallback(msgObj) , msgObj structure is { 'from':INT, 'target':INT, 'action':INT, 'msg_data':JSON }, 目前action 值有两个：P2PMESSAGE(100),JOIN(101)。
   */
  function registerOnP2pMsgImpl(onP2pCallback) {
    window.PKJSBridge.on('p2pMsg', onP2pCallback);
  }

  /**
   * 主app 跳转到指定页面。
   * @param url 为要跳转到的url。
   * @param closeThis 为一个int 值，默认为0，非0则表示跳转后关闭当前页面。
   */
  function openUrlImpl(url, closeThis) {
    window.PKJSBridge.invoke('openUrl', { 'url': url, 'closeThis': closeThis });
  }

  function logToAppImpl(msg) {
    if (!window.PKJSBridge) {
      return;
    }
    window.PKJSBridge.call('log', { 'msg': msg });
  }

  /**
   * 日志埋点。
   * @param data 为一个JSON Object, 里面包含要记录的内容。
   */
  function logToStatisticsImpl(data) {
    window.PKJSBridge.call('logToStatistics', data);
  }

  /**
   * 请求关闭并释放当前webView。
   * @param txt 是一个字符串，供客户端在关闭webview 时弹出toast。
   */
  function closeWithMsgImpl(txt) {
    window.PKJSBridge.call('closeWithMsg', { 'text': txt });
  }

  /**
   * 请求播放一条声音，并指定循环次数。
   * @param path 为声音完整路径，无须后缀名。如：/media/bgm
   * @param 循环次数，repeat=1 表示一共播放 2 遍，0 表示不重复，-1 表示无限循环重复播放。
   * @param {Function} onPlayingCallback(playObj) 是一个回调，playObj 结构为 {'track_id':INT}, trackId 可用于调用 stopPlaying。
   */
  function playSoundImpl(path, repeat, onPlayingCallback) {
    window.PKJSBridge.invoke('playSound', { 'sound_path': path, 'sound_repeat': repeat }, onPlayingCallback);
  }

  /**
   * 请求停止播放一个声音。
   * @param soundTrackId 为从 playSound 的回调中得到的 trackId。
   */
  function stopPlayingImpl(soundTrackId) {
    window.PKJSBridge.call('stopPlaying', { 'track_id': soundTrackId });
  }

  /**
   * 通用接口。具体请求看请求的函数名。
   * @param name 为要请求的函数名。
   * @param data 为包含请求数据的json object，结构自由定义。
   * @param {Function} callbackFunc(callbackData) 是一个回调，callbackData 的类型和结构，每个调用可以自由定义。
   */
  function callHostAppImpl(name, data, callbackFunc) {
    window.PKJSBridge.invoke('callHostApp', { 'name': name, 'data': data }, callbackFunc);
  }

  return {
    version: '2.0',
    onReady: onPKJsBridgeReady,
    registerOnPause: onPKJsSysPause,
    registerOnResume: onPKJsSysResume,
    getSessionData: getSessionDataImpl,
    openUrl: openUrlImpl,
    getSessionDatas: getSessionDatasImpl,
    getUsers: getUsersImpl,
    reportGameReady: reportGameReadyImpl,
    reportInsufficientDeposit: reportInsufficientDepositImpl,

    reportGameState: reportGameStateImpl,
    registerGameStateChanged: registerGameStateChangedImpl,

    requestNewRound: requestNewRoundImpl,
    requestRoundStart: requestRoundStartImpl,
    submitRoundResult: submitRoundResultImpl,
    requestJoinARound: requestJoinARoundImpl,

    requestExtend: requestExtendImpl,
    requestSendInGameData: requestSendInGameDataImpl,

    registerOnP2pMsg: registerOnP2pMsgImpl,

    toast: toastImpl,
    logToApp: logToAppImpl,
    logToStatistics: logToStatisticsImpl,
    closeWithMsg: closeWithMsgImpl,
    playSound: playSoundImpl,
    stopPlaying: stopPlayingImpl,
    callHostApp: callHostAppImpl,
  };

}());