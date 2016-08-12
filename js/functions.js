function _(s) {
  return typeof l10n[s] != 'undefined' ? l10n[s] : s;
}

function md5(s) {
  var hexcase = 0;
  var chrsz = 8;

  function safe_add(x, y){
    var lsw = (x & 0xFFFF) + (y & 0xFFFF);
    var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xFFFF);
  }
  function bit_rol(num, cnt){
    return (num << cnt) | (num >>> (32 - cnt));
  }
  function md5_cmn(q, a, b, x, s, t){
    return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s),b);
  }
  function md5_ff(a, b, c, d, x, s, t){
    return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
  }
  function md5_gg(a, b, c, d, x, s, t){
    return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
  }
  function md5_hh(a, b, c, d, x, s, t){
    return md5_cmn(b ^ c ^ d, a, b, x, s, t);
  }
  function md5_ii(a, b, c, d, x, s, t){
    return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
  }

  function core_md5(x, len){
    x[len >> 5] |= 0x80 << ((len) % 32);
    x[(((len + 64) >>> 9) << 4) + 14] = len;
    var a =  1732584193;
    var b = -271733879;
    var c = -1732584194;
    var d =  271733878;
    for(var i = 0; i < x.length; i += 16){
      var olda = a;
      var oldb = b;
      var oldc = c;
      var oldd = d;
      a = md5_ff(a, b, c, d, x[i+ 0], 7 , -680876936);
      d = md5_ff(d, a, b, c, x[i+ 1], 12, -389564586);
      c = md5_ff(c, d, a, b, x[i+ 2], 17,  606105819);
      b = md5_ff(b, c, d, a, x[i+ 3], 22, -1044525330);
      a = md5_ff(a, b, c, d, x[i+ 4], 7 , -176418897);
      d = md5_ff(d, a, b, c, x[i+ 5], 12,  1200080426);
      c = md5_ff(c, d, a, b, x[i+ 6], 17, -1473231341);
      b = md5_ff(b, c, d, a, x[i+ 7], 22, -45705983);
      a = md5_ff(a, b, c, d, x[i+ 8], 7 ,  1770035416);
      d = md5_ff(d, a, b, c, x[i+ 9], 12, -1958414417);
      c = md5_ff(c, d, a, b, x[i+10], 17, -42063);
      b = md5_ff(b, c, d, a, x[i+11], 22, -1990404162);
      a = md5_ff(a, b, c, d, x[i+12], 7 ,  1804603682);
      d = md5_ff(d, a, b, c, x[i+13], 12, -40341101);
      c = md5_ff(c, d, a, b, x[i+14], 17, -1502002290);
      b = md5_ff(b, c, d, a, x[i+15], 22,  1236535329);
      a = md5_gg(a, b, c, d, x[i+ 1], 5 , -165796510);
      d = md5_gg(d, a, b, c, x[i+ 6], 9 , -1069501632);
      c = md5_gg(c, d, a, b, x[i+11], 14,  643717713);
      b = md5_gg(b, c, d, a, x[i+ 0], 20, -373897302);
      a = md5_gg(a, b, c, d, x[i+ 5], 5 , -701558691);
      d = md5_gg(d, a, b, c, x[i+10], 9 ,  38016083);
      c = md5_gg(c, d, a, b, x[i+15], 14, -660478335);
      b = md5_gg(b, c, d, a, x[i+ 4], 20, -405537848);
      a = md5_gg(a, b, c, d, x[i+ 9], 5 ,  568446438);
      d = md5_gg(d, a, b, c, x[i+14], 9 , -1019803690);
      c = md5_gg(c, d, a, b, x[i+ 3], 14, -187363961);
      b = md5_gg(b, c, d, a, x[i+ 8], 20,  1163531501);
      a = md5_gg(a, b, c, d, x[i+13], 5 , -1444681467);
      d = md5_gg(d, a, b, c, x[i+ 2], 9 , -51403784);
      c = md5_gg(c, d, a, b, x[i+ 7], 14,  1735328473);
      b = md5_gg(b, c, d, a, x[i+12], 20, -1926607734);
      a = md5_hh(a, b, c, d, x[i+ 5], 4 , -378558);
      d = md5_hh(d, a, b, c, x[i+ 8], 11, -2022574463);
      c = md5_hh(c, d, a, b, x[i+11], 16,  1839030562);
      b = md5_hh(b, c, d, a, x[i+14], 23, -35309556);
      a = md5_hh(a, b, c, d, x[i+ 1], 4 , -1530992060);
      d = md5_hh(d, a, b, c, x[i+ 4], 11,  1272893353);
      c = md5_hh(c, d, a, b, x[i+ 7], 16, -155497632);
      b = md5_hh(b, c, d, a, x[i+10], 23, -1094730640);
      a = md5_hh(a, b, c, d, x[i+13], 4 ,  681279174);
      d = md5_hh(d, a, b, c, x[i+ 0], 11, -358537222);
      c = md5_hh(c, d, a, b, x[i+ 3], 16, -722521979);
      b = md5_hh(b, c, d, a, x[i+ 6], 23,  76029189);
      a = md5_hh(a, b, c, d, x[i+ 9], 4 , -640364487);
      d = md5_hh(d, a, b, c, x[i+12], 11, -421815835);
      c = md5_hh(c, d, a, b, x[i+15], 16,  530742520);
      b = md5_hh(b, c, d, a, x[i+ 2], 23, -995338651);
      a = md5_ii(a, b, c, d, x[i+ 0], 6 , -198630844);
      d = md5_ii(d, a, b, c, x[i+ 7], 10,  1126891415);
      c = md5_ii(c, d, a, b, x[i+14], 15, -1416354905);
      b = md5_ii(b, c, d, a, x[i+ 5], 21, -57434055);
      a = md5_ii(a, b, c, d, x[i+12], 6 ,  1700485571);
      d = md5_ii(d, a, b, c, x[i+ 3], 10, -1894986606);
      c = md5_ii(c, d, a, b, x[i+10], 15, -1051523);
      b = md5_ii(b, c, d, a, x[i+ 1], 21, -2054922799);
      a = md5_ii(a, b, c, d, x[i+ 8], 6 ,  1873313359);
      d = md5_ii(d, a, b, c, x[i+15], 10, -30611744);
      c = md5_ii(c, d, a, b, x[i+ 6], 15, -1560198380);
      b = md5_ii(b, c, d, a, x[i+13], 21,  1309151649);
      a = md5_ii(a, b, c, d, x[i+ 4], 6 , -145523070);
      d = md5_ii(d, a, b, c, x[i+11], 10, -1120210379);
      c = md5_ii(c, d, a, b, x[i+ 2], 15,  718787259);
      b = md5_ii(b, c, d, a, x[i+ 9], 21, -343485551);
      a = safe_add(a, olda);
      b = safe_add(b, oldb);
      c = safe_add(c, oldc);
      d = safe_add(d, oldd);
    }
    return [a, b, c, d];
  }
  function str2binl(str){
    var bin = [];
    var mask = (1 << chrsz) - 1;
    for(var i = 0; i < str.length * chrsz; i += chrsz) {
      bin[i>>5] |= (str.charCodeAt(i / chrsz) & mask) << (i%32);
    }
    return bin;
  }
  function binl2hex(binarray){
    var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
    var str = "";
    for(var i = 0; i < binarray.length * 4; i++) {
      str += hex_tab.charAt((binarray[i>>2] >> ((i%4)*8+4)) & 0xF) + hex_tab.charAt((binarray[i>>2] >> ((i%4)*8  )) & 0xF);
    }
    return str;
  }
  return binl2hex(core_md5(str2binl(s), s.length * chrsz));
};

function getNiceDate (string_date)
{
  var dt = new XDate(string_date);
  var ret =  dt.toString('HH:mm');
  var today = new XDate().addSeconds(-tz_offset);
  if (today.toString('yyyyMMdd') != dt.toString('yyyyMMdd'))
  {
    ret += ' ('+ dt.toString('dd/MM') + ')';
  }
  return ret;
}

function getNiceDelay(from_time)
{
  if (from_time == '') { return '-'; }

  var delay_sec = new XDate(from_time).diffSeconds(now_time);
  return nice_diff(Math.round(delay_sec));
}

function nice_diff (delay_sec)
{
  if (delay_sec < 60) // moins d'1 min
  {
    return delay_sec+" "+_("sec");
  }
  else if(delay_sec < 3600) // moins d'1 heure
  {
    return Math.round(delay_sec/60, 0)+" "+_("min");
  }
  else if(delay_sec < 3600 * 24) // moins d'1 jour
  {
    //var ret =  Math.floor(delay_sec/3600)+" h";
    var ret =  Math.round(delay_sec/3600);
    if (ret == 1) 
    {
      ret += " "+_("heure");
    }
    else
    {
      ret += " "+_("heures");
    }
    // désormais on n'affiche que les heures
    /*if (delay_sec % 3600 != 0)
    {
      ret = ret + " " + nice_diff(delay_sec % 3600);
    }*/
    return ret;
  }
  else if(delay_sec < 3600 * 24 * 15) // moins 15 jours
  {
    //ret =  Math.floor(delay_sec/(3600*24))+" jours";
    var ret =  Math.round(delay_sec/(3600*24));
    if (ret == 1) 
    {
      ret += " "+_("jour");
    }
    else
    {
      ret += " "+_("jours");
    }
    return ret;
  }
  else if(delay_sec < 3600 * 24 * 30 * (12+7)) // en mois (jusqu'à 1 an et 7 mois)
  {
    //ret =  Math.floor(delay_sec/(3600*24))+" jours";
    var ret =  Math.round(delay_sec/(3600*24)/30);
    ret += " "+_("mois");
    return ret;
  }
  else if(delay_sec > 3600 * 24 * 10000) // 1900 ?
  {
    var ret = "-";
    return ret;
  }
  else // en années
  {
    //ret =  Math.floor(delay_sec/(3600*24))+" jours";
    var ret =  Math.round(delay_sec/(3600*24)/365);
    if (ret == 1) 
    {
      ret += " "+_("an");
    }
    else
    {
      ret += " "+_("ans");
    }
    return ret;
  }
}


function getName(controller_module_id, show_utilisation, show_room)
{
  var periph = periphs[controller_module_id];

  if (periph == null)
  {
    return '';
  }

  var ret = '';
  // on commence par afficher l'usage (ex. lampe) sauf si l'utilisateur en a précisé un
  if (show_utilisation && periph.custom_name == '')
  {
    if (periph.utilisation_id > 0)
    {
      ret += utilisations[periph.utilisation_id][1];
    }
    else
    {
      ret += periph.module_name;
    }
  }

  // si l'utilisateur a précisé un usage il faut le préciser
  if (periph.custom_name != '')
  {
    ret += ' ' + periph.custom_name + '';
    ret = ret.trim();
  }

  // la pièce
  if (show_room && periph.room_id > 0 && rooms[periph.room_id] != null /*la pièce a été supprimée*/)
  {
      // si le nom de la pièce est compris dans le nom, inutile de le rajouer
      if (ret.toLowerCase().indexOf(rooms[periph.room_id][1].toLowerCase()) < 0)
      {
        ret += ' ' + rooms[periph.room_id][1];
      }
  }

	ret = removeBracket(ret.trim()); // une 1ère fois ici en cas de "[Invisible]"

  // au cas où le périphérique n'aurait toujours pas de nom (ex. états génériques)
  if (ret == '')
  {
    if (periph.utilisation_id > 0)
    {
      ret += utilisations[periph.utilisation_id][1].trim();
    }
    else
    {
      ret += periph.module_name.trim();
    }
  }

  ret = ret.trim();

  ret = removeBracket(ret);
  return ret;
}

function removeBracket (str)
{
  str = str.replace(/\[.*?\]/g, ''); // les contenus entre crochets (il peut y en avoir plusieurs
  str = str.replace(/  /g, ' '); // les doubles espaces qui peuvent en résulter
  str = str.trim();
  return str;
}

function doAction(controller_module_id, value)
{
  polling.stop();
  polling.lock();
  var periph = periphs[controller_module_id];

  periph.last_value = value;
  periph.last_action = value;
  periph.active_macro = 0;
  rebuildCurrentWidgets();

  $.ajax({
    url: 'output_exec.php',
    use_local: true,
    data: {
      mobile: 1,
      controller_module_id: controller_module_id,
      type: periph.type,
      last_action: value,
      module_id: periph.module_id    
    },
    complete: function() {
      polling.unlock();
    }
  });

  $.mobile.back();
}

function doMacro(controller_module_id, macro_id)
{
  polling.stop();
  polling.lock();
  var dynamic_value = 0;
  var periph = periphs[controller_module_id];
  var input = $('input[data-macro-id="'+macro_id+'"]');

  if (input != null)
  {
    dynamic_value = input.val();
    update_macro(controller_module_id, macro_id, dynamic_value)
  }
  
  periph.active_macro = macro_id;
  rebuildCurrentWidgets();

  $.ajax({
    url: 'macro_exec.php',
    use_local: true,
    data: {
      controller_module_id: controller_module_id,
      macro_id: macro_id,
      dynamic_value: dynamic_value
    },
    complete: function() {
      polling.unlock();
    }
  });

  $.mobile.back();
}

function updateDynamicMacroAsync(macro_id)
{
  var onSuccess = function(data) {
    $('input[data-macro-id="'+data.macro_id+'"]').val(data.dynamic_value);
    $('span[data-macro-id="'+data.macro_id+'"]').html(data.dynamic_value);

    update_macro(data.controller_module_id, data.macro_id, data.dynamic_value)
  }

  $.ajax({
    url: 'json/dynamic_macro.php',
    data: { macro_id: macro_id },
    use_local: true,
    success: onSuccess
  });
}

function update_macro(controller_module_id, macro_id, value)
{
  $.each(periphs[controller_module_id].macro_list, function(i,macro) {
    if (macro[0] == macro_id)
    {
      macro[3] = value;
    }
  });
}

function change_user(user_id, on_another_box)
{
  push_notifications_unregister();
	
	var allow_local_switch = true;
	// case when you want to switch to an account on another box and your on phonegap+LAN
	if (webapp_mode == 'phonegap' && on_another_box)
	{
		set_on_lan_status(false);
		var allow_local_switch = false; // redundant...
	}

  $.ajax({
    url: 'switch_user.php',
    use_local: allow_local_switch,
    data: { shared_user_id: user_id },
    success: change_user_complete
  });
}

function change_user_complete(data)
{
  if (data.success)
  {
    get_json_panel_list();
  }
  else
  {
    // the account could be no more valid (expiration date)
    p_alert(_("eedomus"), data.errors.reason);
  }
}

function setWizardStatus(controller_module_id, active)
{
  show_loading();

  var periph = periphs[controller_module_id];

  var onSuccess = function(data) {
    if (data.success)
    {
      rebuildCurrentWidgets();
      $.mobile.back();
    }
  }

  $.ajax({
    url: 'json/set_wizard_status.php',
    use_local: true,
    data: {
      user_widget_id: controller_module_id,
      active: active,
    },
    success: onSuccess,
    complete: hide_loading
  });
}

function getCamImage(controller_module_id, last_value_change, last_value, ext)
{
  // TODO: get last image if on_lan

  bright = last_value.replace('.', '-');

  if (bright == '')
  {
    return '/img/camera_no_image.png';
  }
  else
  {
    var dt = new XDate(last_value_change).addSeconds(-tz_offset);
    return 'https://camera'+shard+'.eedomus.com/'+cam_folder+'/' +controller_module_id+ '/' + dt.toString('yyyyMMdd/yyyyMMdd_HHmmss') + '_'+ bright + ext;
  }
}

function check_local_connection()
{
  if (webapp_mode == 'lan')
  {
    set_on_lan_status(true);
    return;
  }

  if (webapp_mode == 'wan')
  {
    set_on_lan_status(false);
    return;
  }

  if (box_lan_ip == null || (box_wan_ip != null && user_ip != null && box_wan_ip != user_ip))
  {
    set_on_lan_status(false);
    return;
  }

  var onSuccess = function(data) {
    set_on_lan_status(data && data.controller_id && data.controller_id == box_id);
  }

  var onError = function() {
    set_on_lan_status(false);
  }

  $.ajax({
    url: 'lan.php',
    force_local: true,
    timeout: 2000,
    success: onSuccess,
    error: onError
  });
}

function set_on_lan_status(value)
{
	//avoid disabling LAN mode in case of box reboot or local connection difficulty
	if (webapp_mode == 'lan' && value == false) { return; }
  
	on_lan = value;
  localChecked.resolve();
  on_lan ? $('.lan-icon').addClass('lan-icon-show') : $('.lan-icon').removeClass('lan-icon-show');
  if (webapp_mode == 'wan')
  {
    // Compare box_wan_ip and user_ip
    if (box_wan_ip != null && user_ip != null && box_wan_ip == user_ip)
    {
      blink_lan_icon.start();
    }
    else
    {
      blink_lan_icon.stop();
    }
  }
}

blink_lan_icon = {

  do_blink: false,
  start: function() {
    if (this.do_blink)
    {
      return;
    }
    $('.lan-icon').addClass('blink');
    this.do_blink = true;
    this.blink();
  },
  stop: function() {
    $('.lan-icon').removeClass('blink');
    this.do_blink = false;
  },
  blink: function() {
    if (blink_lan_icon.do_blink) {
      $('.lan-icon').delay(200).fadeTo(200,0.5).delay(200).fadeTo(200,1, blink_lan_icon.blink);
    }
  }
}

function getHost() {
  if (webapp_mode == 'lan')
  {
    // no url prefix when on LAN mode
    return '';
  }
  if (on_lan)
  {
    return 'http://'+box_lan_ip+'/';
  }
  return HOST;
}

function load_localization()
{
  var onSuccess = function(data) {
    l10n = data;
    $('[data-translate="true"]').each(function() {
      $(this).html(_($(this).html()));
    });
  }

  var onError = function(error,y,z) {
    console.log('Error during loading localization file');
  }

  var onComplete = function() {
    localizationLoaded.resolve();
  }

  $.ajax({
    url: 'lang/'+lang+'.json',
    beforeSend: null, // We load files on same structure
    success: onSuccess,
    error: onError,
    complete: onComplete
  });
}

function get_localization()
{
  if (!lang)
  {
    lang = window.navigator.languages ? window.navigator.languages[0] : null;
    lang = lang || window.navigator.language || window.navigator.browserLanguage || window.navigator.userLanguage;
    lang = lang.substring(0,2).toLowerCase();
  }
  load_localization();
}

function checkScroll() {

  var activePage = $.mobile.pageContainer.pagecontainer("getActivePage"),
      screenHeight = $.mobile.getScreenHeight(),
      contentHeight = $(".ui-content", activePage).outerHeight(),
      scrolled = $(window).scrollTop(),
      header = $(".ui-header", activePage).outerHeight() - 1,
      footer = $(".ui-footer", activePage).outerHeight() - 1,
      scrollEnd = contentHeight - screenHeight + header + footer,
      page = activePage[0].id;

  if ((page != "history_page" && page != "notifications_page")
    || (page == "history_page" && $("[data-role='nd2tabs']").hasClass('nd2Tabs') && $("[data-role='nd2tabs']").tabs('getActiveTab') != 'history'))
  {
    $(document).off("scrollstop");
    return;
  }

  if (scrolled >= scrollEnd)
  {
    $(document).off("scrollstop");
    show_loading();

    if (page == "history_page")
    {
      controller_module_id = $('#history_list').data('controller-id');
      filter_mvt = $('#history_list').data('filter-mvt');

      setTimeout(function() {
        build_history(controller_module_id, filter_mvt, true);
      }, 500);
    }
    if (page == "notifications_page")
    {
      setTimeout(function() {
        build_notifications(true);
      }, 500);
    }
  }
}

var Base64 = {
  
  _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",


    encode: function(input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;

        input = Base64._utf8_encode(input);

        while (i < input.length) {

            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }

            output = output + this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) + this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

        }

        return output;
    },


    decode: function(input) {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        while (i < input.length) {

            enc1 = this._keyStr.indexOf(input.charAt(i++));
            enc2 = this._keyStr.indexOf(input.charAt(i++));
            enc3 = this._keyStr.indexOf(input.charAt(i++));
            enc4 = this._keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }

        }

        output = Base64._utf8_decode(output);

        return output;

    },

    _utf8_encode: function(string) {
        string = string.replace(/\r\n/g, "\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if ((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        }

        return utftext;
    },

    _utf8_decode: function(utftext) {
        var string = "";
        var i = 0;
        var c = c1 = c2 = 0;

        while (i < utftext.length) {

            c = utftext.charCodeAt(i);

            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            }
            else if ((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i + 1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            }
            else {
                c2 = utftext.charCodeAt(i + 1);
                c3 = utftext.charCodeAt(i + 2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }

        }

        return string;
    }

}

function getJsonParam (json)
{
	if (json == '')
	{
		return null;
	}
	else
	{
		json = '{' + json + '}';
		json = json.replace('&', '"'); // on enlève le 1er '&'
		json = json.replace(/='/g, '":"');
		json = json.replace(/'&/g, '","');
		json = json.replace(/":",/g, '=","'); // pb par ex. pour le accound code qui est une chaine qui termine par un "="
    json = json.replace(/'}$/, '"}');

		return JSON.parse(json); 
	}
}

function checkIOTcomissioning(unread_first_message_id)
{
	// speficic value for IOT demo
	if (unread_first_message_id == -2)
	{
		stop();
		//alert('New IOT device detected');
		
		function showComissioning(data) {
			$.mobile.pageContainer.pagecontainer("change", "#iot_comissionning_page");
			$('#iot_room').empty()
			$.each(data.rooms, function(id, room) {
				$('#iot_room').append('<option value="'+room.room_id+'">'+room.name+'</option>').selectmenu('refresh');
			});
			
			// select a menu value
			//$("#iot_room").val(1).selectmenu('refresh', true);
		}

		$.ajax({
				url: 'iot_rooms.php',
				use_local: true,
				success: showComissioning,
				error: function() {
				},
				complete: function() {
				}
			});
		
		return false;
	}
	
	return true;
}

function rebuildCurrentWidgets()
{
	if (polling.current_page == 'widgets_page' || polling.prev_page == 'widgets_page')
	{
		//console.log('rebuild widgets');
		build_widgets( $('#widgets_page').data('panel-id'));
	}
	else if (polling.current_page == 'favorite_page' || polling.prev_page == 'favorite_page')
	{
		//console.log('rebuild favorites');
		build_widgets( -1 );
	}
}

function addWidgetDiv(html)
{
	// vertically align center
	html = '<div class="widget_container"><div class="widget_content">'+html+'</div></div>';
	return html;
}

function var_dump(obj) {
	var out = '';
	for (var i in obj) {
			out += i + ": " + obj[i] + "\n";
	}

	alert(out);
}

function getDeviceChannels(controller_module_id, room_id)
{
	var channels = new Array();
	if (periphs[controller_module_id].parent_controller_module_id != '' || periphs[controller_module_id].parent_controller_module_id == controller_module_id)
	{
		return channels;
	}
	
	var i = 0;
	for(var id in periphs)
	{
		// device must be active and in the same room
		if (periphs[id].parent_controller_module_id == controller_module_id && periphs[id].active && periphs[id].room_id == room_id)
		{
			channels[i] = periphs[id];
			i++;
		}
	}
	
	return channels;
}