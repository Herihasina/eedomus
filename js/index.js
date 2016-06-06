var VERSION = '1.0';
var doubleClickToExit = true;
l10n = [];

var PLATFORM = null
var backbuttonLastClick = 0;

var authentication = window.localStorage.getItem("authentication");
var php_session_id = window.localStorage.getItem("php_session_id");
var deviceToken = window.localStorage.getItem("device_token");
var box_lan_ip = window.localStorage.getItem("box_lan_ip");
var box_id = window.localStorage.getItem("box_id");
var box_wan_ip = null;
var user_ip = null;
var lang = window.localStorage.getItem("lang");
var user_id = null;
var theme = '';
var sortable_panels = [];
var panels = {};
var widgets = {};
var periphs = {};
var utilisations = {};
var rooms = {};
var linked_user = [];
var wizards = {};
var graphs = {};
var appFavorite = [];
var shard = '';
var tz_offset = 0;
var cam_folder = 'secure';
var subscription_status_id = 0;
var now_time = new XDate();
var startup_time = new XDate();
var backbuttonLastClick = null;
var on_lan = false;
var HOST = window.localStorage.getItem("HOST") || 'https://m.eedomus.com/';

var favoris_elements = "";
var indice_map = 0;
var latitude = 0;
var longitude = 0;
var lat_long = '';

var state_locate_more = false;
var startTime = new Date().getTime();

var temp = {};

if (webapp_mode == 'wan' && window.location.href.match(/^https:\/\/.*\.eedomus\.com/))
{
  // direct calls on wan/lan webserver
  HOST = '';
}

var gapReady = $.Deferred();
var jqmReady = $.Deferred();
var domReady = $.Deferred();
var pushReady = $.Deferred();
var initReady = $.Deferred();
var configLoaded = $.Deferred();
var localChecked = $.Deferred();
var localizationLoaded = $.Deferred();

// Fast click lib, for faster click response on mobile browsers
$(function() { FastClick.attach(document.body); });

// Wait for jQuerymobile and cordova init
if (typeof cordova != 'undefined')
{
  document.addEventListener("deviceReady", onDeviceReady, false);
  document.addEventListener("backbutton", backbutton, false);
  document.addEventListener("resume", onResume, false);
  document.addEventListener("pause", onPause, false);
}
else
{
  cordova = false;
  gapReady.resolve();
  pushReady.resolve();
}

function onDeviceReady()
{
  register_push_notifications();
  gapReady.resolve();
}

function onMobileInit()
{
  $.mobile.autoInitializePage = false;
  $.mobile.defaultPageTransition = 'none';
  jqmReady.resolve();
}

$(document).one("mobileinit", onMobileInit);

$(document).ready(function() {
  domReady.resolve();
});

$.when(gapReady, jqmReady, domReady).then(init);

// Init
function init()
{
  // Highcharts settings
  Highcharts.setOptions({
    global: {
      useUTC: false
    },
    lang: {
      months: [_('Janvier'), _('Février'), _('Mars'), _('Avril'), _('Mai'), _('Juin'), _('Juillet'), _('Août'), _('Septembre'), _('Octobre'), _('Novembre'), _('Décembre')],
      weekdays: [_('Dimanche'), _('Lundi'), _('Mardi'), _('Mercredi'), _('Jeudi'), _('Vendredi'), _('Samedi')],
      decimalPoint: '.',
      thousandsSep: ''
    }
  });

  // Ajax settings
  $.ajaxSetup({
    dataType: 'json',
    crossDomain: true,
    method: 'GET',
    beforeSend: function(jqXHR, settings) {

      if (settings.url != 'log_post.php' && authentication)
      {
        jqXHR.setRequestHeader('Authorization', 'Basic '+authentication);
      }

      if (settings.force_local && !box_lan_ip)
      {
        return false;
      }

      if (settings.use_local && webapp_mode == 'lan')
      {
        // LAN mode, site from the box
        settings.url = settings.url;
      }
      else if ((settings.use_local && on_lan) || settings.force_local)
      {
        settings.url = 'http://'+box_lan_ip+'/'+settings.url;
      }
      else
      {
        settings.url = HOST+settings.url;
      }

      settings.url += (settings.url.indexOf('?') > -1) ? '&app=pg' : '?app=pg';
      if (php_session_id)
      {
        settings.url += '&PHPSESSID='+php_session_id;
      }
      return true;
    }
  });

  // Check if box is on same network
  check_local_connection();

  // Load localization
  get_localization();

  // Init tabs
  $("[data-role='nd2tabs']").tabs();

  // Waves
  Waves.attach('a', ['.waves-circle']);
  Waves.attach('button', ['.waves-circle']);
  Waves.init();

  // Vibration on click
	// disabled (too long vibration on iPhone, problematic when using the app on the bed at night, to re-enable but with an option)
  /*if (navigator && navigator.vibrate)
  {
    $(document).on('vclick', function() {
      navigator.vibrate(30);
    });
  }*/

  // Page events
  $( document ).on( "pagecontainerbeforechange", function ( event, data ) {
    
    if ( typeof data.toPage == "object")
    {
      var toPage = data.toPage[0];
      var cm_list = $(toPage).data('polling-cm-list');
      var prevPage_polling = $(toPage).data('polling-prev-page');
      var time = $(toPage).data('polling-time');

			var page_id = $(toPage).attr('id');
      if (page_id == 'login_page' && authentication || page_id == 'loading' || page_id == 'home')
      {
        data.toPage[0] = $("#home")[0];
      }
      else if (cm_list)
      {
        polling.setCmList(cm_list);
        polling.setCurrentPage(toPage.id);
        polling.setPrevPage(prevPage_polling);
        polling.setTime(time);
        polling.start(false);
      }
      else
      {
        polling.stop();
      }
    }
  });

  // Login page
  $('#login_page').keyup(function(e) {
    if (e.keyCode == 13) {
      login();
    }
  });

  // Swipe pannel
  $('div[data-role="header"], #login_page').on( "swiperight", function(e) {
      e.stopImmediatePropagation();
      e.preventDefault();
  });
  $('#home').on( "swiperight", function(e) {
    if ( $.mobile.activePage.jqmData( "panel" ) !== "open" ) {
      $( "#nav_panel" ).panel( "open" );
    }
    e.preventDefault();
  });

  // Resize events
  $( window ).resize(set_panels_icons_width);
  $( window ).resize(set_graph_width_height);

  // Events
  $('#login_submit').on('click', login);
	$('#comissioning_submit').on('click', function() { iot_comission(false); });
	$('#comissioning_cancel').on('click', function() { iot_comission(true); });
  $('#nav_panel a[href="#users_page"]').on('click', build_users);
	$('#nav_panel a[href="#restart_drivers"]').on('click', restart_drivers); // NXP IOT
  $('#nav_panel a[href="#logout"]').on('click', logout);
  $('#nav_panel a[href="#notifications_page"]').on('click', build_notifications);
  //click sur favoris azerty
  $('a[href="#favorite_page"]').on('click', build_widgets);

  $('a[href="#edit_favorite_page"]').on('click', build_edit_favorite);
  $('a[href="#refresh"]').on('click', function () {
		$('#nav_panel').panel('close'); 
		window.localStorage.setItem("last_panel_id", 0);
		get_json_panel_list(); 
	});
  $('a[href="#home"]').on('click', function () { $('#nav_panel').panel('close'); build_panels(); window.localStorage.setItem("last_panel_id", 0); });
		 
  $('#box_ip_btn').on('click', function() {
    $('.box-ip').toggle();
    if ($('.box-ip').is(':visible'))
    {
      var last_known_box_lan_ip = window.localStorage.getItem("last_known_box_lan_ip");
      if (last_known_box_lan_ip != null && last_known_box_lan_ip.indexOf('.') > 0)
      {
        $('#box_ip').val(last_known_box_lan_ip);
      }
      else
      {
        $('#box_ip').val('192.168.0.30');
      }
    }
  });
  
  // box menu only on lan mode
  if (webapp_mode != 'lan')
  {
    $('.box-config').hide();
  }

  // Panel page events
  $('.main-panel').on('click', 'a', function() {
    build_widgets($(this).data('panel-id'));
  });
	
	// Widget channels events
	// data-page-to : complexe mecanism to avoid href default when "sub widget" is clicked
	$('#widgets_list, #favorite_list').on('click', 'div', function()
	{
		var channel_controller_module_id = $(this).data('channel-controller-id');
		if (typeof(channel_controller_module_id) != 'undefined') 
		{
			window.clicked_page_to = $(this).data('page-to');
			window.clicked_controller_module_id = channel_controller_module_id;
		}
	});

  // Widget page events
  $('#widgets_list, #favorite_list').on('click', 'a', function()
	{
		var controller_module_id = $(this).data('controller-id');
		// data-page-to : complexe mecanism to avoid href default when "sub widget" is clicked
		if (typeof(window.clicked_page_to) != 'undefined')
		{
			widget_clicked(window.clicked_controller_module_id, null, window.clicked_page_to);
			window.clicked_page_to = undefined;
			window.clicked_controller_module_id = undefined;
		}
		else
		{
			var widget_id = $(this).data('widget-id'); // if wizard
			widget_clicked(controller_module_id, widget_id, $(this).data('page-to'));
		}
	});

  //Favoris_panel events
  $('#favoris_panel').on('click', 'a', function()
  { 
    var controller_module_id = $(this).data('controller-id');
    // data-page-to : complexe mecanism to avoid href default when "sub widget" is clicked
    if (typeof(window.clicked_page_to) != 'undefined')
    {
      widget_clicked(window.clicked_controller_module_id, null, window.clicked_page_to);
      window.clicked_page_to = undefined;
      window.clicked_controller_module_id = undefined;
    }
    else
    {
      var widget_id = $(this).data('widget-id'); // if wizard
      widget_clicked(controller_module_id, widget_id, $(this).data('page-to'));
    }
  });

    $('#favoris_panel_acc').on('click', 'a', function()
  { 
    var controller_module_id = $(this).data('controller-id');
    // data-page-to : complexe mecanism to avoid href default when "sub widget" is clicked
    if (typeof(window.clicked_page_to) != 'undefined')
    {
      widget_clicked(window.clicked_controller_module_id, null, window.clicked_page_to);
      window.clicked_page_to = undefined;
      window.clicked_controller_module_id = undefined;
    }
    else
    {
      var widget_id = $(this).data('widget-id'); // if wizard
      widget_clicked(controller_module_id, widget_id, $(this).data('page-to'));
    }
  });
// end favoris panel events



	function widget_clicked(controller_module_id, widget_id, toPage)
	{
		// we need to manually call the page, because href is not set for the widgets and subwidgets (if set, there are href issues between widgets and subwidgets)
		$.mobile.pageContainer.pagecontainer("change", toPage);
		
    $('#history_list').removeData();

    if (toPage == "#periph_page")
    {
      build_periph(controller_module_id);
    }
    else if (toPage == '#wizard_page')
    {
      build_wizard(widget_id);
    }
    else if (toPage == '#history_page')
    {
      $('ul[data-role="nd2tabs"]').show();
      build_graph(controller_module_id);
    }
  }

  // Periph page events
  $('#periph_list').on('click', 'a', function(e) {

    var controller_module_id = $(this).data('controller-id');
    var toPage = $(this).attr('href');

    if ($(e.target).hasClass('macro_input')) {
      return false;
    }

    if (toPage == "#history_page")
    {
      var filter_mvt = $(this).data('filter-mvt');
      if (typeof filter_mvt != 'undefined')
      {
        $('ul[data-role="nd2tabs"]').hide();
        build_history(controller_module_id, filter_mvt);
      }
      else
      {
        $('ul[data-role="nd2tabs"]').show();
        build_graph(controller_module_id);
      }
    }
    else
    {
      if ($(this).data('action') == 'macro')
      {
        doMacro($(this).data('module-id'), $(this).data('macro-id'));
      }
      else
      {
        doAction($(this).data('module-id'), $(this).data('value'));
      }
    }
  });

  // Wizard page events
  $('#wizard_list').on('click', 'a', function(e) {
    var widget_id = $(this).data('widget-id');
    var active = $(this).data('active');
    setWizardStatus(widget_id, active);
  });

  // Graph page events
  $('li[data-tab]').on('click', function() {

    var controller_module_id = $('#history_page').data('controller-id');
    var tab = $(this).data('tab');

    if (tab == 'history')
    {
      build_history(controller_module_id, -1);
    }
    else
    {
      build_graph(controller_module_id, tab);
    }
  });

  // Change account
  $('#users_list').on('click', 'a', function(e) {
    var on_another_box = $(this).data('another-box');
    if (webapp_mode == 'lan' && on_another_box)
    {
      p_alert(_("eedomus"), _("Vous ne pouvez changer de box en mode LAN."));
      return;
    }
    var user_id = $(this).data('user-id');
    change_user(user_id, on_another_box);
  });

  $('.lan-icon').on('click', function() {
    if (!$(this).hasClass('blink'))
    {
      p_alert(_("Connexion directe"), _("La connexion est établie en direct avec votre box eedomus, les performances sont maximales."));
      return;
    }
    p_confirm(
      '',
      _('Connexion directe à la box détectée.')+' '+_('Souhaitez-vous vous y connecter pour de meilleures performances ?'),
      [_('Oui'),_('Non')],
      function(buttonPressed) {
        if (buttonPressed == '1')
        {
          document.location.href = 'http://'+box_lan_ip;
        }
      }
    );
  })

  // Initialize page
  window.localStorage.setItem("version", VERSION);
  PLATFORM = cordova ? device.platform.toLowerCase() : null;
  $("body").show();

  if (navigator && navigator.userAgent)
  {
    var match = navigator.userAgent.match(/OS (\d+)_\d+(_\d+|) like Mac OS X/)
    if (match && parseInt(match[1]) >= 9)
    {
      $.mobile.hashListeningEnabled = false;
    }
  }
  $.mobile.initializePage();
  initReady.resolve();

  if (cordova)
  {
    navigator.splashscreen.hide();
  }

  if (authentication)
  {
    // Try to connect with cached authentication
    $.when(localChecked, localizationLoaded).then(get_json_panel_list);
  }
  else
  {
    // Show login page
    $.when(localizationLoaded).then(show_login);
  }
}

// Resume
function onResume()
{
  if (XDate() > startup_time.addSeconds(10))
  {
    console.log('resume polling');
    polling.start();
    main_polling.start();
    lan_polling.start();
  }
}

// Pause
function onPause()
{
  if (XDate() > startup_time.addSeconds(10))
  {
    console.log('stop polling');
    polling.stop();
    main_polling.stop();
    lan_polling.stop();
  }
}

// IOT demo comissioning
function iot_comission(cancel)
{
	show_loading();
	
	var onSuccess = function (data) 
	{
		hide_loading();
		get_json_panel_list();
		
		// should show device room but doesn't work
		build_widgets(data.panel_id);
	}
	
	var onError = function (data) 
	{
		// Connection error
		p_alert(_('Erreur'), _('Erreur de sauvegarde'));
		hide_loading();  
  }
	
	var mode = 'comissioning';
	if (cancel) { mode = 'cancel'; }
	
	$.ajax({
	url: 'iot.php',
		method: 'POST',
		use_local: 1,
		data: {
			mode: mode,
			iot_name: $('#iot_name').val(),
			iot_room: $('#iot_room').val()
		},
		success: onSuccess,
		error: onError,
		timeout: 4000
  });
}

// Connect from login page
function login()
{
  show_loading();

  var onSuccess = function (data) {

    if (!data.success)
    {
      // Login failed
      p_alert(_('Erreur'), data.errors.reason);
      hide_loading();
    }
    else
    {
      // Login success
      if (data.session)
      {
        php_session_id = data.session;
      }
      window.localStorage.setItem("authentication", authentication);
      window.localStorage.setItem("HOST", HOST);
      push_notifications_register();
      get_json_panel_list();
    }
  }

  var onError = function (data) {
    if (webapp_mode == 'phonegap' && on_lan)
    {
      p_alert(_('Erreur'), _('Connexion directe impossible. Tentative de connexion via internet.'));
      // We retry on eedomus server
      $('#box_ip').val('');
      $('.box-ip').hide();;
      on_lan = false;
      login();
    }
    else
    {
      // Connection error
      p_alert(_('Erreur'), _('Connexion impossible'));
      hide_loading();  
    }
  }

  username = $('#username').val();
  password = md5($('#password').val());
  var use_local = (webapp_mode == 'lan');  // allow direct login/logout on LAN mode

  if ($('.box-ip').is(':visible') && $('#box_ip').val().match(/\d+\.\d+\.\d+\.\d+/))
  {
    box_lan_ip = $('#box_ip').val();
    use_local = true;
    on_lan = true;
  }
  
  // with other modes than phonegap, we keep the current domain/IP as host
  if (webapp_mode != 'wan')
  {
    HOST = 'https://m.eedomus.com/';

    if (username.match(/^d:/))
    {
      username = username.substring(2);
      HOST = 'https://devmobile.eedomus.com/';
    }
  }
  authentication = Base64.encode(username+':'+password);

  $.ajax({
    url: 'log_post.php',
    method: 'POST',
    use_local: use_local,
    data: {
      user_login: username,
      of: password,
      connexion: 'mobile',
      save: '1'
    },
    success: onSuccess,
    error: onError,
    timeout: 4000
  });
}

var box_name_;
var box_id_;

// Get json panels
function get_json_panel_list()
{
	var temp_panel_lists = {};
	
  show_loading();

  var onSuccess = function(data)
  { 
  	temp_panel_lists = data.controllers[0];

  	box_name_ = temp_panel_lists[1];
  	box_id_ = temp_panel_lists[0];

    if (data.is_connected == 0)
    {
      // Authentication failed -> Login
      local_storage_clear_special();
      $('#username, #password').empty();
      show_login();
      hide_loading();
      return false;
    }

    if (webapp_mode != 'lan')
    {
      var controllers = [];
      $.each(data.controllers, function(index, controller) {
        if (controller[4] == 1 /*real controller*/)
        {
          controllers.push(controller);
        }
      });
      if (controllers.length == 1)
      {
        user_ip = data.ip;
        box_id = controllers[0][0];
        box_lan_ip = controllers[0][5];
        box_wan_ip = controllers[0][7];
        lan_polling.start();
      }
      else
      {
        box_lan_ip = null;
        box_id = null
      }
      window.localStorage.setItem("box_lan_ip", box_lan_ip);
      window.localStorage.setItem("last_known_box_lan_ip", box_lan_ip); // for direct connection textbox on login
      window.localStorage.setItem("box_id", box_id);
    }
    

    sortable_panels = [];

    $.each(data.panels, function(index, panel) {
      panels[panel.panel_id] = panel;
      sortable_panels.push(panel.panel_id);
    });

    $.each(data.widgets, function(index, widget) {
      widgets[widget.user_widget_id] = widget;
    });

    var cm_list = [];
    $.each(data.periphs, function(index, periph) {
      periphs[periph.controller_module_id] = periph;
      cm_list.push(periph.controller_module_id);
    });
    $('#home').data('polling-cm-list', cm_list);
    $('#home').data('polling-time', 5000);

    $.each(data.utilisations, function(index, utilisation) {
      utilisations[utilisation[0]] = utilisation;
    });

    $.each(data.rooms, function(index, room) {
      rooms[room[0]] = room;
    });

    if (lang != data.lng)
    {
      lang = data.lng;
      load_localization();
      window.localStorage.setItem("lang", lang);
    }

    user_id = data.user_id;
    theme = data.theme;
    icon_bg = data.icon_bg;
    subscription_status_id = data.subscription_status_id;
    now_time = new XDate(data.now_time);
    linked_user = data.linked_user;
    shard = data.s ? data.s : '';
    tz_offset = data.tz_offset;
    appFavorite = data.appFavorite;
		
		if (typeof(data.has_iot) == 'undefined' && data.user_login.toLowerCase().indexOf('nxpcaen') < 0 /*sinon ne marche pas sous phonegap car le fichier*/)
		{
			$('.restart-drivers').hide();
		}

    if (data.session)
    {
      php_session_id = data.session;
      window.localStorage.setItem("php_session_id", php_session_id);
    }

    // We hide account change if no secondary accounts
    linked_user.length > 0 ? $('a[href="#users_page"]').parent('li').show() : $('a[href="#users_page"]').parent('li').hide();

    push_notifications_register();
    build_panels();
    
    configLoaded.resolve();
    
    // we need to do that after the layout is visible
    if (webapp_mode == 'lan')
    {
      set_on_lan_status(true);
    }
		
		restore_panel();
		main_polling.start();
  }

  var onError = function(data, status) {
    hide_loading();
    p_alert(_('Erreur'), _('Connexion échouée'));
    // get_json_panel_list();
    show_login();
  }

  $.ajax({
    url: 'json_panel_list.php',
    use_local: true,
    success: onSuccess,
    error: onError
  });
}

// Logout
function logout()
{
  var onButtonPressed = function(buttonPressed) {
    if (buttonPressed == '1')
    {
      $.ajax({
        url: 'logout.php',
        use_local: true,
        success: logout_success
      });
    }
    else
    {
      $('#nav_panel').panel('close');
    }
  }

  p_confirm(_('Déconnexion'), _('Voulez-vous vous déconnecter ?'), [_('OK'),_('Annuler')], onButtonPressed);

  return false;
}

function logout_success()
{
  main_polling.stop();
  local_storage_clear_special();
  authentication = null;
  box_lan_ip = null;
  lang = null;
  php_session_id = null; // the session must be clean after logout.php post
  $('#username, #password, #box_ip').empty();

  push_notifications_unregister();
      
  if (webapp_mode == 'phonegap')
  {
    set_on_lan_status(false); // force online login for next time, after logout
  }
  show_login();
}

function local_storage_clear_special()
{
  var last_known_box_lan_ip = window.localStorage.getItem("last_known_box_lan_ip");
  localStorage.clear();
  window.localStorage.setItem("last_known_box_lan_ip", last_known_box_lan_ip);
}




// Register Push notifications
function register_push_notifications()
{
  // Don't wait if already exist
  if (deviceToken != null) {
    pushReady.resolve();
  }

  var push = PushNotification.init({ "android": {"senderID": "624973159290", "icon":"ic_stat_notification_android", "sound": true, "vibrate": true},
	 "ios": {"alert": "true", "badge": "true", "sound": "true"},
	 "windows": {} });

  push.on('notification', function(data) {
    if (data && data.msg)
    {
			if (cordova)
			{
				// permet de glisser des tags HTML dans les notifs (ex. caméra NXP IOT)
				data.msg = data.msg.replace('[br]', '<br>');
				data.msg = data.msg.replace('[img', '<img');
				data.msg = data.msg.replace('/img]', '>');
				
				$( "#p" ).children('').html(data.msg);
				$( "#p" ).popup();
				$( "#p" ).popup("open"); 
				
				// if app is already launched and has focus
				// (the other case is we have received the notification while in background and then click on the notification, in this case we don't want a seconde time the sound)
				//var_dump(data.additionalData);
				if (data.additionalData.foreground)
				{
					setTimeout( function(){ $( "#p" ).popup( "close" ); }, 20 /*sec*/ *1000);

					// in app notifications sounds must be handled here
					var path = window.location.pathname;
					path = path.substr(path, path.length - 10);
					var sound = 'file://' + path + 'sounds/eedomuspush.mp3';
			
					//alert("Debug : trying to play "+sound);
					var audio = new Audio(sound);
					audio.play();
				}
			}
			else
			{
				p_alert(_('Nouvelle notification'), data.msg);
			}
    }
    else
    {
      $.when(configLoaded).then(function() {
        build_notifications();
        $.mobile.pageContainer.pagecontainer("change", "#notifications_page");
      });
    }
  });

  push.on('error', function() {
    pushReady.resolve();
  });

  push.on('registration', function(data) {
    deviceToken = data.registrationId;
    pushReady.resolve();
    window.localStorage.setItem("deviceToken", deviceToken);
  });
}

// Send device token
function push_notifications_register()
{
  if (!cordova || !deviceToken)
  {
    return;
  }

  $.ajax({
    url: 'notification_subscribe.php',
    data: {
      notification_id: deviceToken,
      user_id: user_id,
      platform: PLATFORM
    }
  })
}

// unregister deviceToken
function push_notifications_unregister()
{
  if (!cordova || !deviceToken)
  {
    return;
  }

  $.ajax({
    url: 'notification_unsubscribe.php',
    data: {
      notification_id: deviceToken,
      user_id: user_id,
      platform: PLATFORM
    }
  })
}

// Build panels
function build_panels()
{
  $('.main-panel').empty();

  $.each(sortable_panels, function(index, panel_id) {

    var panel = panels[panel_id];
    if (panel.panel_type_id == 5) // Home
    {
      $('#home_header').html(panel.name);
      return true;
    }
    if (panel.panel_type_id == 3)  // Technic
    {
      return true;
    }

    var div = '<div>';
    div += '<a href="#widgets_page" data-panel-id="'+panel.panel_id+'"><img src="'+getHost()+'img/mdm/'+theme+'/'+panel.img+'"/></a>';
    div += '<span>'+panel.name+'</span>';
    div += '</div>'
    $('.main-panel').append(div);
  })

  $('.main-panel>div img').css('background-image', 'url(\''+getHost()+'img/btn/'+icon_bg+'\')');
  
  set_panels_icons_width();
  hide_loading();

  Waves.attach('.main-panel img', ['waves-button', 'waves-block']);
  Waves.init();
}

// Build Widgets  azerty
function build_widgets(panel_id)
{
      
  var periph_list = [];
  var wizard_list = [];
  var cm_list = [];
  favoris_elements = "";
  if (typeof panel_id != 'number' || panel_id == -1)
  {
    // Favorites
    panel_id = -1;
    var list = $('#favorite_list');
    
    var panel = {
      panel_id: -1,
      name: _('Favoris')
    }

    periph_list = appFavorite;
  }
  else
  {
    // Periphs and Wizards
    var panel = panels[panel_id];
    var list = $('#widgets_list');

    $.each(panel.widgetList, function(index, widget_id) {

      var widget = widgets[widget_id];
      if (widget == null) return;
      
      var periph = periphs[widget.controller_module_id];
      
      if (periph != null)
      {
        periph_list.push(periph.controller_module_id);
      }
      else if (widget.controller_wizard_id > 0 && widget.controller_module_id == 0)
      {
        wizard_list.push(widget_id);
      }
    });

    $('#widgets_header').html(panel.name);
    $('#widgets_page').data('panel-id', panel.panel_id);
  }

  periph_list.sort(function(a,b) {
    // on webkit (Chrome, Safari) we must return an integer not a boolean for sort functions
    return getName(a, true).localeCompare(getName(b, true));
  });

  list.empty();
	
	var hidden_channels = new Array();
  $.each(periph_list, function(index, controller_module_id) {

    var periph = periphs[controller_module_id];
		if (typeof(panels[panel_id]) != 'undefined' && panels[panel_id].panel_type_id == 1 /*pièce*/)
		{
			var show_utilisation = true;
			var show_room = false;
		}
		else
		{
			// utilisation
			var show_utilisation = true;
			var show_room = true;
		}
    var last_value_show = periph.last_value;
    var module_image = periph.default_image;
    var href = '#periph_page';

    if (periph.last_action != "")
    {
      last_value_show = periph.last_action;
    }
    if (periph.action != 1)
    {
      href = '#history_page';
    }

    if (periph.value_list != null)
    {
      // Get current value from value_list
      $.each(periph.value_list, function(k, value) {
        if (last_value_show == value[0])
        {
          last_value_show = value[1];
          if (value[2] != '')
          {
            module_image = value[2];
          }
          return false;
        }
      });
    }

    if (periph.module_id == 7 /* camera */|| periph.module_id == 19 /* image */) 
    {
			var cam_url = '';
      if (last_value_show.indexOf('http://', 0) < 0)
      {
				var params = getJsonParam(periph.params);
				// default camera direct for NXP Demo
				if (typeof(params.FORCE_DIRECT) != 'undefined' && params.FORCE_DIRECT == 1)
				{
					var ar = getCamUrl(controller_module_id);
					last_value_show = ar[0];
					cam_url = ar[1];
				}
				else
				{
        	last_value_show = getCamImage(periph.controller_module_id, periph.last_value_change, periph.last_value, '.jpg');
				}
      }
    }
    else if (periph.value_type == 'float')
    {
      // Add unit
      last_value_show = Math.round(last_value_show*100)/100;
      last_value_show += ' '+periph.value_unit;
    }

    if (periph.active_macro != '' && periph.active_macro != 0)
    {
      $.each(periph.macro_list, function(index, macro) {
        if (periph.active_macro == macro[0])
        {
          var macro_id = macro[0];
          var macro_name = macro[1];
          var dynamic_value = macro[3];

          macro_name = macro_name.replace('[x]', '<span data-macro-id="'+macro_id+'">'+dynamic_value+'</span>');
          // Update macro is done during polling
  
          last_value_show += ' ('+macro_name+')';
        }
      });
    }

    var since_from = '';
    if (periph.last_action !== "")
    {
      since_from += '('+_('En cours')+'...)';
    }
    else
    {
      if (periph.value_type == 'float' || periph.module_id == 7 /* camera */ || periph.utilisation_id == 96 /*voice recognition*/)
      {
        since_from += ' '+_('il y a {0}')+' ';
      }
      else
      {
        since_from += ' '+_('depuis {0}')+' ';
      }
      
      since_from = since_from.replace('{0}', '<span>'+getNiceDelay(periph.last_value_change)+'</span>');
    }

    
    // geolocation and google map   
    if(periph.module_id == 31 && panel.name == "Géolocalisation"){
      indice_map++;
      var id_geomap = 'geomap'+indice_map;
      temp.controller_geo_id = periph.controller_module_id;
      geo_pos          = periph.last_value;
      geo_pos          = geo_pos.split(",");
      temp.geo_pos_lat = parseFloat(geo_pos[0]);
      temp.geo_pos_lng = parseFloat(geo_pos[1]);
     
      setTimeout(function(){
        var add_map = 1;
          while (add_map <= indice_map) {
            var map = new google.maps.Map(document.getElementById('geomap'+indice_map), {
              zoom: 12,
              center: new google.maps.LatLng(temp.geo_pos_lat, temp.geo_pos_lng),
              mapTypeId: google.maps.MapTypeId.ROADMAP,
              zoomControl: false,
              scaleControl: true,
              streetViewControl: false,
              mapTypeControl: false
            });
            indice_map--;
          }


            var marker = new google.maps.Marker({
                map: map, 
                position: new google.maps.LatLng(temp.geo_pos_lat, temp.geo_pos_lng)  
            });
            // $('#widget_'+parseInt(temp.controller_geo_id)).fadeOut();
      },1);

      // include the map in div geomap
      var date_actuel = new Date();
      //var div_geoloc = '<li class="geoloc_card" >'+ periph.custom_name +' depuis '+ getNiceDelay(periph.last_value_change) +'<div class="nd2-card">';
      var div_geoloc = '<li class="geoloc_card" > <div class="nd2-card">';
      div_geoloc += '<div class="card-title has-supporting-text cam-header">';
      div_geoloc +=   '<div style="background-color:#c0c0c0;">'+periph.custom_name+'</div>';
      div_geoloc +=   '<a href="#" data-page-to="#map-page">';
      div_geoloc +=     '<div class="card-media geomap" id="'+id_geomap+'"></div>';
      div_geoloc +=   '</a>';
      div_geoloc += '</div></div></li>';

      list.append(div_geoloc);
    }


    if (periph.module_id == 7 /* camera */|| periph.module_id == 19 /* image */)
    {
      var div = '<li class="camera_card"><div class="nd2-card">';
      div += '<div class="card-title has-supporting-text cam-header">';
      div += '<h3 class="card-primary-title cam-title">'+getName(periph.controller_module_id, show_utilisation, show_room)+'</h3>';
      div += '<h5 class="card-subtitle cam-title cam-subtitle">'+since_from+'</h5>';
      div += '</div>';

      div += '<div class="card-media"><a href="#" data-page-to="#periph_page" data-controller-id="'+periph.controller_module_id+'"><img id="cam_img'+periph.controller_module_id+'" class="card-avatar cam-img" src="'+last_value_show+'" cam_url='+cam_url+'></a>';
      //div += '<div class="card-action">';
      //div += '<a href="#" class="ui-btn ui-btn-inline">'+_('Direct')+'</a>';
      //div += '<a href="#history_page" data-filter-mvt="1" data-controller-id="'+periph.controller_module_id+'" class="ui-btn ui-btn-inline">'+_('Historique des mouvements')+'</a>';
      //div += '<a href="#history_page" data-filter-mvt="0" data-controller-id="'+periph.controller_module_id+'" class="ui-btn ui-btn-inline">'+_('Historique complet')+'</a>';
      //div += '</div>';

      div += '</div></div></li>';
      list.append(div);
			
			// default camera direct for NXP Demo
			var params = getJsonParam(periph.params);
			if (typeof(params.FORCE_DIRECT) != 'undefined' && params.FORCE_DIRECT == 1)
			{
				$('#cam_img'+periph.controller_module_id).on('load', function() {
					var src = $(this).attr('cam_url').replace(/&time=\d+/, '');
					if (src != '') // intimacy
					{
						$(this).attr('src', src+'&time='+XDate().getTime());
					}
				});
			}
    }
    else
    {
			// data-page-to : complexe mecanism to avoid href default when "sub widget" is clicked
      var li = '<li id="widget_'+periph.controller_module_id+'"><a href="#" data-page-to="'+href+'" data-controller-id="'+periph.controller_module_id+'">';
      var li_favoris = '<li id="widget_'+periph.controller_module_id+'" class="ui-li-has-thumb ui-first-child"><a class="ui-btn ui-btn-icon-right ui-icon-carat-r waves-effect waves-button waves-float" href="#" data-page-to="'+href+'" data-controller-id="'+periph.controller_module_id+'">';
			// multiple embeded icons for rules toggle widgets
			var tok = module_image.split('|');
			for (var i = 0; i < tok.length; i++)
			{
				if (i > 0) { var img_class = "ui-thumbnail ui-thumbnail-over"; } else { var img_class = "ui-thumbnail";}
          if(periph.module_id == 31 && panel.name == "Géolocalisation"){
            li += '';
          }else{
            li += '<img src="'+getHost()+'img/mdm/'+theme+'/'+tok[i]+'" class="'+img_class+'" />';
          }
     	 	
        li_favoris += '<img src="'+getHost()+'img/mdm/'+theme+'/'+tok[i]+'" class="'+img_class+'" />';
			}
			
			/************** Begining of IOT channel widget test *************/
			
			var channel_div = '';
			var channels = getDeviceChannels(periph.controller_module_id, periph.room_id);
			for (var i = 0; i < channels.length; i++)
			{
				if ((periph.type == 'zigbee' || periph.type == 'ble') && periph.parent_controller_module_id == "")
				{
					var channel_controller_module_id = channels[i].controller_module_id;
					if (typeof(channel_controller_module_id) == 'undefined') { break; }
					hidden_channels.push(channel_controller_module_id);
					var periph_channel = periphs[channel_controller_module_id];
					var channel_img = periph_channel.default_image;
					
					var val = periph_channel.last_value;
					var channel_value = val + ' ' + periph_channel.value_unit;
					if (periph_channel.value_list != null)
					{
						// Get current value from value_list
						$.each(periph_channel.value_list, function(k, value) {
							if (val == value[0] && value[2] != '')
							{
								channel_value = value[1];
								channel_img = value[2];
								return false;
							}
						});
					}
					
					var channel_page_to = '#periph_page';
					if (periph_channel.action != 1)
					{
						channel_page_to = '#history_page';
					}
					
					// data-page-to : complexe mecanism to avoid href default when "sub widget" is clicked
					channel_div += '<div class="channel_action" data-page-to="'+channel_page_to+'" data-parent-controller-module-id="'+periph.controller_module_id+'" data-channel-controller-id="'+channel_controller_module_id+'"><img src="'+getHost()+'img/mdm/'+theme+'/'+channel_img+'" class="ui-thumbnail-channel" /><div class="txt_channel">'+channel_value+'</div></div>';
				}
				
				/************** End of IOT channel widget test *************/
				
			}

      // à masquer pour map
      if(periph.module_id == 31 && panel.name == "Géolocalisation"){
        li = '';
      }else{
        li += addWidgetDiv(channel_div+'<h2>'+getName(periph.controller_module_id, show_utilisation, show_room)+'</h2><p class="widget_line_detail"><b>'+last_value_show+'</b> '+since_from+"...</p>");
      }
      list.append(li);

      li_favoris += addWidgetDiv(channel_div+'<h2>'+getName(periph.controller_module_id, show_utilisation, show_room)+'</h2><p class="widget_line_detail"><b>'+last_value_show +'</b> ' + since_from+"</p>");
      li_favoris += '</a></li>';
      favoris_elements += li_favoris;
    }
		
    cm_list.push(periph.controller_module_id);
  });
	
	// hide all channels that already have a quick action link
	for(var id in hidden_channels)
	{
		$('#widget_'+hidden_channels[id]).hide();
	}

  $.each(wizard_list, function(index, widget_id) {

    var li = '<li id="widget_'+widget_id+'"><a href="#" data-page-to="#wizard_page" data-widget-id="'+widget_id+'">';
    li += '<img src="'+getHost()+'img/mdm/'+theme+'/wait.png" class="ui-thumbnail" />';
    li += addWidgetDiv('<h2>'+_('Veuillez patienter...')+'</h2><p class="widget_line_detail"></p>');
    li += '</a></li>';

    list.append(li);

    var wizardShow = function(data) {
      var lia = $('li a[data-widget-id="'+data.user_widget_id+'"]');
      var check_image = (data.active ? 'check_yes' : 'check_no');

      lia.children('img').attr('src', getHost()+'img/mdm/'+theme+'/'+data.image+'.png').after();
      lia.children('img').after('<img src="'+getHost()+'img/mdm/'+theme+'/'+check_image+'.png" class="ui-thumbnail ui-thumbnail-over" />');
      lia.children('').children('').children('h2').html(data.name);
      lia.children('').children('').children('p').html(data.html);

      wizards[data.user_widget_id] = data;
    }

    $.ajax({
      url: 'json/controller_wizard_detail.php',
      use_local: true,
      data: { user_widget_id: widget_id },
      success: wizardShow
    });
  });
  
  list.listview().listview('refresh');
  $('.ui-thumbnail').not('.ui-thumbnail-over').css('background-image', 'url(\''+getHost()+'img/btn/'+icon_bg+'\')');
  $('.ui-thumbnail-channel').not('.ui-thumbnail-channel-over').css('background-image', 'url(\''+getHost()+'img/btn/'+icon_bg+'\')');
	
  if (panel_id === -1)
  {	
    $('#favorite_page').data('polling-cm-list', cm_list).data('polling-time', 3000);
    $('#periph_page').data('polling-prev-page', 'favorite_page');
  }
  else
  {
    $('#widgets_page').data('polling-cm-list', cm_list).data('polling-time', 3000);
    $('#periph_page').data('polling-prev-page', 'widgets_page');
  }
  Waves.attach('.secondary-panel a', ['waves-button', 'waves-float']);
  Waves.init();
	
	// remember last panel for next login/Refresh
	window.localStorage.setItem("last_panel_id", panel_id);
}

//////////////////////-------///////////////////

function getCamUrl(controller_module_id)
{
	var periph = periphs[controller_module_id];
	var params = getJsonParam(periph.params);

	if (periph.last_value == 'intimacy_start')
	{
		var cam_image = '/img/intimacy_start.jpg';
		cam_url = '';
	}
	else
	{
		// temporary image to wait for proxy
		if (webapp_mode == 'phonegap')
		{
			var cam_image = 'img/camera_loading.png';
		}
		else
		{
			var cam_image = '/webapp/img/camera_loading.png';
		}
		
		// gestion proxy des caméras car Chrome ne sait pas gérer le basic auth dans les img/src et on ne peut faire la récupération en Ajax à cause du CORS
		if (on_lan || (typeof(params.FORCE_DIRECT) != 'undefined' && params.FORCE_DIRECT == 1))
		{
			// on est sur le même réseau que la caméra
			var cam_url = getHost()+'cam_proxy.php?ip='+params.LAN_IP+'&port='+params.LAN_PORT+'&user='+params.ADMIN_LOGIN+'&pwd='+params.FTP_PASS+'&url='+encodeURIComponent(params.direct_img)+'&time='+XDate().getTime();
		}
		else
		{
			// on est sur un réseau externe
			var cam_url = getHost()+'cam_proxy.php?ip='+params.WAN_IP+'&port='+params.WAN_PORT+'&user='+params.ADMIN_LOGIN+'&pwd='+params.FTP_PASS+'&url='+encodeURIComponent(params.direct_img)+'&time='+XDate().getTime();
		}
	}
	return new Array(cam_image, cam_url);
}

// Build periph
function build_periph(controller_module_id)
{
  var periph = periphs[controller_module_id];
	if (typeof(periph) == 'undefined') { return; }
	
	var show_utilisation = true;
  var show_room = true;

  $('#periph_list').empty();
  $('#periph_header').html(getName(controller_module_id, false));
  $('#periph_page').data('controller-module-id', controller_module_id);

  if (periph != null && periph.active != 0)
  {
		if (periph.module_id == 7 /* camera */|| periph.module_id == 19 /* image */)
    {
    	var ar = getCamUrl(controller_module_id);
			var cam_image = ar[0];
			var cam_url = ar[1];

      var div = '<li class="camera_card"><div class="nd2-card">';
      div += '<div class="card-title has-supporting-text">';
      div += '<h3 class="card-primary-title">'+getName(periph.controller_module_id, show_utilisation, show_room)+' ('+_('Direct')+')</h3>';
      div += '</div>';

      div += '<div class="card-media"><img id="direct_cam" class="card-avatar" src="'+cam_image+'" cam_url="'+cam_url+'"></a>';
      div += '<div class="card-action">';
      div += '<a href="#history_page" data-filter-mvt="1" data-controller-id="'+periph.controller_module_id+'" class="ui-btn ui-btn-inline">'+_('Historique des mouvements')+'</a>';
      div += '<a href="#history_page" data-filter-mvt="0" data-controller-id="'+periph.controller_module_id+'" class="ui-btn ui-btn-inline">'+_('Historique complet')+'</a>';
      div += '</div>';
      div += '</div></div></li>';
      $('#periph_list').append(div);

      $('#direct_cam').on('load', function() {
				var active_page = $.mobile.pageContainer.pagecontainer("getActivePage")[0].id;
        if (active_page == 'periph_page' || active_page == 'favorite_page')
        {
          var src = $(this).attr('cam_url').replace(/&time=\d+/, '');
          if (src != '') // intimacy
          {
            $(this).attr('src', src+'&time='+XDate().getTime());
          }
        }
      });
    }
    else if (periph.action != 1)
    {
      build_graph(widget_id);
      return;
    }

    if (periph.action != 0)
    {
      // Action
      $.each(periph.value_list, function(i, action) {
        var action_value = action[0];
        var action_name = action[1];
        var action_img = action[2];
        var mobile_action = action[3];

        if (mobile_action == 1)
        {
          if (action_img == '')
          {
            action_img = "default.png";
          }

          var li = '<li><a href="#" class="list_no_arrow" data-action="action" data-module-id="'+periph.controller_module_id+'" data-value="'+action[0]+'">';
         
					// multiple embeded icons for rules toggle widgets
					var tok = action_img.split('|');
					for (var i = 0; i < tok.length; i++)
					{
						if (i > 0) { var img_class = "ui-thumbnail ui-thumbnail-over"; } else { var img_class = "ui-thumbnail";}
						 li += '<img src="'+getHost()+'img/mdm/'+theme+'/'+tok[i]+'" class="'+img_class+'" />';
					}
          
          if (action_value == periph.last_value)
          {
            li += addWidgetDiv('<h2>'+action_name+'</h2>'+'<p class="widget_line_detail">('+_('Actuellement')+')</p>');
          }
					else
					{
						li += addWidgetDiv('<h2>'+action_name+'</h2>');
					}
          li += '</a></li>';
        }
        $('#periph_list').append(li);
      });

      $.each(periph.macro_list, function(i, macro) {
        if (macro[2] /*show macro or not*/)
        {
          var macro_id = macro[0];
          var macro_name = macro[1];
          var dynamic_value = macro[3];

          if (macro_name.indexOf('[x]') >= 0)
          {
            dynamic_value = '<input type="number" pattern="[0-9]*" data-clear-btn="false" value="'+dynamic_value+'" class="macro_input" data-macro-id="'+macro_id+'" data-enhanced="true">';
            macro_name = macro_name.replace('[x]', dynamic_value);
            updateDynamicMacroAsync(macro_id);
          }

          var li = '<li><a href="#" class="list_no_arrow" data-action="macro" data-module-id="'+periph.controller_module_id+'" data-macro-id="'+macro_id+'">';
          li += '<img src="'+getHost()+'img/mdm/'+theme+'/macro.png" class="ui-thumbnail" />';
          li += addWidgetDiv('<h2>'+macro_name+'</h2>');
          li += '</a></li>';
          
          $('#periph_list').append(li);
        }
      });

      var li = '<li><a href="#history_page" data-controller-id="'+controller_module_id+'">';
      li += '<img src="'+getHost()+'img/mdm/'+theme+'/graphe.png" class="ui-thumbnail" />';
      li += addWidgetDiv('<h2>'+_("Détail")+'</h2>');
      li += '</a></li>';
      $('#periph_list').append(li);
    }
  }

  $('#periph_list').listview().listview('refresh');
  $('.ui-thumbnail').not('.ui-thumbnail-over').css('background-image', 'url(\''+getHost()+'img/btn/'+icon_bg+'\')');

  if (periph.module_id != 7 /* camera */&& periph.module_id != 19 /* image */)
  {
    $('#periph_page').data('polling-cm-list', [controller_module_id]).data('polling-time', 3000);
  }

  Waves.attach('.secondary-panel a', ['waves-button', 'waves-float']);
  Waves.init();
}

// Build Wizard
function build_wizard(widget_id)
{
	
	if (typeof(widget_id) == 'undefined') { return; }
  var widget = widgets[widget_id];
  var wizard = wizards[widget_id];

  var li = '<li><a href="#" data-widget-id="'+widget_id+'" data-active="1">';
  li += '<img src="'+getHost()+'img/mdm/'+theme+'/'+wizard.image+'.png" class="ui-thumbnail" />';
  li += '<img src="'+getHost()+'img/mdm/'+theme+'/check_yes.png" class="ui-thumbnail ui-thumbnail-over" />';
  li += addWidgetDiv('<h2>'+_("Activer")+'</h2>');
  li += '</a></li>';
  li += '<li><a href="#" data-widget-id="'+widget_id+'" data-active="0">';
  li += '<img src="'+getHost()+'img/mdm/'+theme+'/'+wizard.image+'.png" class="ui-thumbnail" />';
  li += '<img src="'+getHost()+'img/mdm/'+theme+'/check_no.png" class="ui-thumbnail ui-thumbnail-over" />';
  li += addWidgetDiv('<h2>'+_("Désactiver")+'</h2>');
  li += '</a></li>';

  $('#wizard_list').html(li);
  $('#wizard_header').html(wizard.name);
  $('#wizard_list').listview().listview('refresh');
  $('.ui-thumbnail').not('.ui-thumbnail-over').css('background-image', 'url(\''+getHost()+'img/btn/'+icon_bg+'\')');

  Waves.attach('.secondary-panel a', ['waves-button', 'waves-float']);
  Waves.init();
}

// Build Graph
function build_graph(controller_module_id, tab, polling)
{
	if (typeof(controller_module_id) == 'undefined') { return; }
	
  var active_page = $.mobile.pageContainer.pagecontainer("getActivePage");

  if (tab == null)
  {
    tab = '24hours';
    graphs = {};
    $('[id^="hightchart"]').empty();
    $("[data-role='nd2tabs']").tabs('switchTabWithoutTransition', $("li[data-tab='"+tab+"']"), tab, 1);
  }
  else if (active_page[0].id != 'history_page'
    || (polling && $("[data-role='nd2tabs']").tabs('getActiveTab') != tab)
    || (!polling && typeof graphs[tab] != 'undefined'))
  {
    $(window).resize();
    return;
  }

  var periph = periphs[controller_module_id];
	if (typeof(periph) == 'undefined') { return; }

  $('#history_page').data('controller-id', controller_module_id);
  $('#history_header').html(getName(controller_module_id, false, false));

  var onSuccess = function(data) {

    var chart_dim = get_chart_dim();

    graphs[tab] = $('#hightchart_'+tab).highcharts({
      title: {text: null},
      xAxis: {type: 'datetime', min: data.start_date, max: data.end_date, plotBands: data.nights, gridLineWidth: 1},
      yAxis: {title: {text: data.series[0].value_unit}, plotLines:[{value:0, width:1, color:'#808080'}], min: data.min_value, max: data.max_value, tickInterval: data.tick_intervall_y },
      tooltip: {formatter:function(){return Highcharts.dateFormat(this.series.name+'<br>'+_('Le %e %B à %H:%M:%S'), this.x)+'<br>'+Highcharts.numberFormat(this.y, 1)+data.series[0].value_unit}},
      legend: {enabled: false},
      plotOptions: {spline:{ lineWidth:2, marker:{enabled:true}, states: {hover: {marker: {enabled: true, symbol: 'circle', radius: 3, lineWidth: 1}}}}},
      series: data.series,
      chart: {
        width: chart_dim.width,
        height: chart_dim.height
      }
    });

    if (tab != '24hours' && subscription_status_id == 0)
    {
      p_alert(_('Attention'), _("Durée indisponible pour ce type d'abonnement"))
    }

    // Poll graphs
    window.setTimeout(function() {
      build_graph(controller_module_id, tab, true)
    }, 300000);
  }

  var data = {
    controller_module_id: periph.controller_module_id,
    browser_time: XDate().toString('yyyy-MM-dd HH:mm:ss'),
  }

  if (tab != '24hours')
  {
    data.end_date = XDate().addDays(-1).toString('yyyy-MM-dd HH:mm:00');

    switch(tab)
    {
      case '4days': data.start_date = XDate().addDays(-1).addDays(-4).toString('yyyy-MM-dd HH:mm:00'); break;
      case '4weeks': data.start_date = XDate().addDays(-1).addWeeks(-4).toString('yyyy-MM-dd HH:mm:00'); break;
      case '4months': data.start_date = XDate().addDays(-1).addMonths(-4).toString('yyyy-MM-dd HH:mm:00'); break;
      case '1year': data.start_date = XDate().addDays(-1).addYears(-1).toString('yyyy-MM-dd HH:mm:00'); break;
    }
  }

  show_loading();

  $.ajax({
    url: 'chart/chart_data.php',
    data: data,
    success: onSuccess,
    complete: hide_loading
  });
}

// Build History
function build_history (controller_module_id, filter_mvt, polling)
{
  $("[data-role='nd2tabs']").tabs('switchTabWithoutTransition', $("li[data-tab='history']"), 'history', 0);

  var list = $('#history_list');
  var title = _('Historique');
  var ext = '.jpg';
  var start = 0;
  var is_camera = (filter_mvt !== -1);
  var limit = is_camera ? 5 : 15;

  if (polling)
  {
    // Load more data
    start = list.data('start');
    start += limit + 1;
  }
  else
  {
    list.data('controller-id', controller_module_id);
    list.data('filter-mvt', filter_mvt);
    list.empty();
  }

  list.data('start', start);

  var periph = periphs[controller_module_id];

  if (!polling && is_camera)
  {
    if (filter_mvt == 1)
    {
      title = _('Mouvements');
    }
    title = getName(periph.controller_module_id, true)+' ('+title+')';

    $('#history_header').html(title);
  }

  show_loading();

  var onSuccess = function(data) {

    $.each(data.lines, function(index, line) {
      if (is_camera)
      {
        var image_src = getCamImage(line.controller_module_id, line.value_time, line.value, ext);
        var div = '<li class="camera_card"><div class="nd2-card">';
        div += '<div class="card-title has-supporting-text">';
        div += '<h5 class="card-subtitle">'+getNiceDate(line.value_time)+'</h5>';
        div += '</div>';
        div += '<div class="card-media"><img class="card-avatar" src="'+image_src+'"></div>';
        div += '</div></li>';

        list.append(div);
      }
      else
      {
        var module_image = periph.default_image;
        var val = line.value;

        if (periph.value_list != null)
        {
          // Get current value from value_list
          $.each(periph.value_list, function(k, value) {
            if (val == value[1] && value[2] != '')
            {
              module_image = value[2];
              return false;
            }
          });
        }

        if (periph.value_unit)
        {
          // Add unit
          val = Math.round(val*100)/100;
          val += ' '+periph.value_unit;
        }

        var li = '<li><a class="list_no_arrow" href="#">';
        li += '<img src="'+getHost()+'img/mdm/'+theme+'/'+module_image+'" class="ui-thumbnail" />';
        li += addWidgetDiv('<h2>'+val+'</h2><p class="widget_line_detail">'+getNiceDate(line.value_time)+'</p>');
        li += '</a></li>';

        list.append(li);
      }
    });

    list.listview().listview('refresh');
    $('.ui-thumbnail').css('background-image', 'url(\''+getHost()+'img/btn/'+icon_bg+'\')');
    // Lazy loader
    if (data.has_more_lines)
    {
      $(document).on("scrollstop", checkScroll);
    }
    else
    {
      $(document).off("scrollstop", checkScroll);
    }
  }

  $.ajax({
    url: 'json/periph_histo.php',
    data: {
      controller_module_id: controller_module_id,
      start: start,
      limit: limit,
      filter_mvt: filter_mvt,
      sort: 'value_time',
      dir: 'DESC'
    },
    success: onSuccess,
    complete: hide_loading
  });
}

// Change user
function build_users()
{
  $('#users_list').empty();

  $.each(linked_user, function(index, user) {
    var on_another_box = user[2];
    var image = on_another_box ? 'switch_user.png' : 'switch_user_secondary.png';

    var li = '<li><a href="#" data-user-id="'+user[0]+'" data-another-box="'+on_another_box+'">';
    li += '<img src="'+getHost()+'img/mdm/'+theme+'/'+image+'" class="ui-thumbnail" />';
    li += addWidgetDiv('<h2>'+_("Changer pour")+'</h2><p class="widget_line_detail"><b>'+user[1].toUpperCase()+'</b></p>');
    li += '</a></li>';

    $('#users_list').append(li);
  });

  $('#users_list').listview().listview('refresh');
  $('.ui-thumbnail').css('background-image', 'url(\''+getHost()+'img/btn/'+icon_bg+'\')');
}

// Notifications page
function build_notifications(polling)
{
  show_loading();
  var list = $('#notifications_list');
  var start = 0;
  var limit = 20;

  if (typeof polling == 'boolean' && polling)
  {
    // Load more data
    start = list.data('start');
    start += limit + 1;
  }
  else
  {
    list.empty();
  }

  var onSuccess = function(data) {
    $.each(data.lines, function(index, line) {

      var li = '<li><div>';

      $.each(line.message_type, function(index, img) {
        li += '<img src="'+getHost()+'img/'+img+'"/>';
      });

      li += '<span>'+getNiceDate(line.created_date)+'</span></div>';
      li += '<p class="widget_line_detail">'+line.body+'</p>';
      li += '</li>';
      list.append(li);
    });
    list.listview().listview('refresh');
    list.data('start', start);
    $(document).on("scrollstop", checkScroll);
  }

  $.ajax({
    url: '/json/notification_list.php',
    data: {
      start: start,
      limit: limit,
      sort: 'created_date',
      dir: 'DESC'
    },
    success: onSuccess,
    complete: function() { hide_loading(); }
  })
}

// Favorite edit page
function build_edit_favorite()
{
  show_loading();

  var onSuccess = function(data) {
    $.each(data, function(index, periph) {
      var selected = false;

      if ($.inArray(periph[0], appFavorite) != -1)
      {
        selected = true;
      }
      var li = '<li>';
      li += '<img src="'+getHost()+'img/mdm/'+theme+'/'+periph[2]+'" class="ui-thumbnail" />';
      li += '<p class="widget_line_detail">'+periph[1]+'</p>';
      li += '<select data-role="flipswitch"><option value="-1"></option><option value="'+periph[0]+'" '+(selected ? 'selected' : '')+'></option></select>'
      li += '</li>';
      $('#edit_favorite_list').append(li);
    });

    $('.ui-thumbnail').css('background-image', 'url(\''+getHost()+'img/btn/'+icon_bg+'\')');
    $('#edit_favorite_list').listview().listview('refresh');
    $('#edit_favorite_list select').flipswitch().flipswitch('refresh');

    $('#edit_favorite_list select').on('change', function() {
      var cm_list = [];
      $('#edit_favorite_list select').each(function () {
        var value = $(this).val();
        if (value != -1)
        {
          cm_list.push(parseInt(value));
        }
      });
      save_favorite(cm_list);
    })
  }

  $('#edit_favorite_list').empty();

  $.ajax({
    url: '/json/favorite_edit.php',
    success: onSuccess,
    complete: hide_loading
  })
}

function save_favorite(cm_list)
{
  if (cm_list.length < 1) return;

  appFavorite = cm_list;
  build_widgets();

  $.ajax({
    url: '/json/favorite_save.php',
    data: {
      cm_list: cm_list.join(',')
    }
  })
}

// Ajust panel icons
function set_panels_icons_width()
{
  var window_width = $(window).width();
  var window_height = $(window).height();
  var header_height = $('.ui-header:visible').height();
  var icon_width = 115;
  var padding = 0;
  var window_split_size = 700;

  if (!window_width || window_width < 100)
  {
    // Something wrong
    return $(window).resize();
  }

  if (window_width >= window_split_size)
  {
    padding = 32;
    window_width = window_width/2;
    // Set height
    $('.main-panel, .secondary-panel').height((window_height-header_height)+'px');
  }
  else
  {
    $('.main-panel').height('auto');
  }

  window_width -= padding;
  if ($('#panels_icons div').length * icon_width > window_width)
  {
    var max_icons = Math.floor(window_width/icon_width);
    max_icons = Math.max(max_icons, 3);
    $('.main-panel div').width(Math.floor(window_width/max_icons)+'px');
  }
  else
  {
    $('.main-panel div').width(icon_width+'px');
  }
}

// Ajust graph width and height
function set_graph_width_height()
{
  window.setTimeout(function() {
    var tab = $('li.nd2Tabs-active').data('tab');
    var activePage = $.mobile.pageContainer.pagecontainer("getActivePage")[0].id;
    if (activePage == 'history_page' && typeof graphs[tab] != 'undefined')
    {
      var chart_dim = get_chart_dim();
      graphs[tab].highcharts().setSize(chart_dim.width,chart_dim.height,false);
    }
  }, 300);
}

function get_chart_dim() {
  var document_height = $( window ).height();
  var document_width = $( window ).width();
  var header_height = $( '#history_page>div[data-role="header"]' ).height();
  var chart_width = document_width - 16;
  var chart_height = Math.min(document_height - header_height - 32, chart_width * 0.8);
  return {width: chart_width, height: chart_height};
}

// Init DOM
function init_dom()
{
  if (cordova)
  {
    navigator.splashscreen.hide();
  }
}

function show_loading()
{
  window.setTimeout(function() {
    $.mobile.loading('show');
  }, 0);
}

function hide_loading()
{
  window.setTimeout(function() {
    $.mobile.loading('hide');
  }, 0);
}

function p_alert (title, message, buttonName, callback)
{
  if (cordova)
  {
    navigator.notification.alert(message, callback, title, buttonName);
  }
  else
  {
    alert(title+'\n\n'+message);
    callback;
  }
}

function p_confirm (title, message, buttonName, callback)
{
  var confirm_return = $.Deferred();

  if (cordova)
  {
    navigator.notification.confirm(message, callback, title, buttonName);
  }
  else
  {
    if (title != '')
    {
      title += '\n\n';
    }
    if (confirm(title+message))
    {
      callback('1');
    }
    else
    {
      callback('2');
    }
  }
}

function backbutton()
{
	// disabled (too long vibration on iPhone, problematic when using the app on the bed at night, to re-enable but with an option)
  //navigator.vibrate(30);
  var activePage = $('body').pagecontainer( "getActivePage" ).attr('id');

  if ($.mobile.activePage.jqmData( "panel" ) == "open") {
    // Close pannel if open
    $( "#nav_panel" ).panel( "close" );
  } else if (activePage != 'home' && activePage != 'login_page') {
    $.mobile.back();
  } else if (backbuttonLastClick > (Date.now() - 2000)) {
    // Exit app with two click
    navigator.app.exitApp();
  } else {
    toast_message(_("Appuyez de nouveau sur retour pour quitter..."), 2000);
    backbuttonLastClick = Date.now();
  }
}

function toast_message(message, ttl)
{
  $('.nd2-toast-message').html(message);
  $('#toast').removeClass("nd2-toast-off");
  $("body").addClass("nd2-toast-open");

  if (ttl != null)
  {
    hide_toast(ttl);
  }
}

function hide_toast(ttl)
{
  if (ttl == null)
  {
    ttl = 0;
  }
  window.setTimeout(function() {
    $('#toast').addClass("nd2-toast-off");
    $("body").removeClass("nd2-toast-open");
  }, ttl);
}

function show_login()
{
  $.mobile.pageContainer.pagecontainer("change", "#login_page");
  // On Android, setting the focus is not enough (The username gets focused, but the keyboard is not visible)
  // Temporary disabled, maybe we need to wait for the loading of the page
  //$('body').click(function() { $('#username').focus(); });
  // "normal" focus, for web browsers
  $('#username').focus();
  $('.box-ip').hide();
  if (webapp_mode == 'phonegap')
  {
    $('#box_ip_btn').show();
  }
}

function restore_panel()
{
	var last_panel_id = window.localStorage.getItem("last_panel_id")*1;
	if (last_panel_id == -1 /*favorites*/)
	{
		var page_id = "favorite_page";
	}
	else if(typeof(panels[last_panel_id]) != 'undefined')
	{
		var page_id = "widgets_page";
	}
	else
	{
		// else if the panel doesn't exists anymore, show home
		$.mobile.pageContainer.pagecontainer("change", "#home");
		return;
	}

	polling.setCurrentPage(page_id);
	build_widgets(last_panel_id);
	$.mobile.pageContainer.pagecontainer("change", '#'+page_id);
}

function restart_drivers()
{
	$.ajax({
    url: 'iot_action.php?action=restart_drivers',
		use_local: true
  })
	
	$('#nav_panel').panel('close');
}



$(document).on('pagebeforeshow','#widgets_page',function(){
  $('#widgets_list > li > a')
     .addClass('ui-icon-carat-r')
      .removeClass('ui-icon-gear ui-nodisc-icon ui-alt-icon');

  
  $('#edit-entry-btn').on('tap',function(){
    $('#widgets_list > li > a')
      .removeClass('ui-icon-carat-r')
      .addClass('ui-icon-gear ui-nodisc-icon ui-alt-icon');
    $('#menu-panel').panel('close');

    return false;
  });

  // if ( $('#widgets_list > li > a.ui-icon-gear').length )
  $(document).on('tap','#widgets_list > li > a.ui-icon-gear',function(){ 
    // Pass the ID
    temp.user_widget_id = $(this).data('widget-id');
    temp.controller_module_id = $(this).data('controller-id');

    $.mobile.changePage("#modification-page");

  });



});

$(document).on('pagebeforeshow','#modification-page',function(){
  var nom = '';
  var rooms = {};
  $('#name-periph').val('');
  $("#select-choice").html('');
  
  if (widgets[temp.user_widget_id] != undefined && widgets[temp.user_widget_id].controller_wizard_id > 0)
  {
    json_data = { controller_wizard_id: widgets[temp.user_widget_id].controller_wizard_id };
  }
  else
  {
    json_data = { controller_module_id: temp.controller_module_id };
  }

  show_loading();
  $.ajax({
    url: 'config_select.php',
        method: 'GET',
        use_local: false,
        dataType: 'json',
        data: json_data,
        success: function(response){
          nom = response.custom_name;
          
          $.ajax({
              url: 'json/room_select.php',
                  method: 'GET',
                  use_local: false,
                  dataType: 'json',
                  data: {
                      room_type_id : 1
                  },
                  success: function(response_room){ 
                    rooms = response_room.rooms; 
                    var tmp_label = [];
                    var tmp_roomid = [];
                    for (var i = 0; i < rooms.length; i++) {
                        tmp_label.push(rooms[i].room_label);
                        tmp_roomid.push(rooms[i].room_id);   
                    };
                    tmp_label = tmp_label.sort();
                    tmp_roomid = tmp_roomid.sort();

                    for (var i = 0; i < rooms.length; i++) {                    
                       var opt = new Option(tmp_label[i], tmp_roomid[i]); 
                       $('#select-choice').append(opt);                       
                    };

                    $('#select-choice option[value=37176]').insertBefore( $('#select-choice option[value=1]'));
                    $('#name-periph').val(nom);
                    $("#select-choice").selectmenu("refresh");
                    $('#select-choice-button span').text('[Invisible]');
                  },
                  error: function(){
                      
                  },
                  complete:function(){
                    hide_loading();
                  }
           });

        },
        error: function(){},
        timeout: 4000
 });

});





// Show favorite in right menu
  $('a[href="#menu_favoris"]').on('click', function(){
    build_widgets(-1);
    $('#favoris_panel').empty(); 
    $('#favoris_panel').append(favoris_elements);
  });

  $('a[href="#menu_favoris_acc"]').on('click', function(){
    build_widgets(-1);
    $('#favoris_panel_acc').empty(); 
    $('#favoris_panel_acc').append(favoris_elements);
  });

$('#to-home').on('click',function(){
  $.mobile.changePage("#home");
  return false;
}); 

$('#cancel-btn').on('click', function() { 
  $('#back-btn').click();
  return false;
});

$('#accept-btn').on('click', function() { 
  show_loading();
  $('#modification-page').css('opacity','0.6');
  
  if (widgets[temp.user_widget_id] != undefined && widgets[temp.user_widget_id].controller_wizard_id > 0)
  {
    json_data = { controller_wizard_id: widgets[temp.user_widget_id].controller_wizard_id, custom_name: $('#name-periph').val(), room_id: $('#select-choice').val() };
  }
  else
  {
    json_data = { controller_module_id: temp.controller_module_id, custom_name: $('#name-periph').val(), room_id: $('#select-choice').val() };
  }
  
  $.ajax({
      url: 'config_save.php',
      method: 'POST',
      use_local: false,
      dataType: 'json',
      data: json_data,
      complete: function(){
          hide_loading();
          $('#modification-page').css('opacity','1');
          //back to previous page
          $('#back-btn').click();
          return false;
      },
      success: function(response){},
      error: function(){}
  });
});


//= = = = = = = = = = = Diagnostic page
//= = = = = = = = = = = = = = = = = = = 
$("#id_diag").on('click',function(){ 

  // PhoneGap is loaded and it is now safe to make calls PhoneGap methods
  function onDeviceReady() {
    navigator.network.isReachable("google.com", reachableCallback, {});
  }
  // Check network status
  function reachableCallback(reachability) {
    // There is no consistency on the format of reachability
    var networkState = reachability.code || reachability;
    var states = {};
    states[NetworkStatus.NOT_REACHABLE]                      = 'No network connection';
    states[NetworkStatus.REACHABLE_VIA_CARRIER_DATA_NETWORK] = 'Carrier data connection';
    states[NetworkStatus.REACHABLE_VIA_WIFI_NETWORK]         = 'WiFi connection';
    if (networkState != 0) online = true;
  }
  var online = navigator.onLine || false;

  if(online) {
    // make a request
    $('#network-connection').removeClass('failed').addClass('succeed');

  } else {
    // load from localStorage
    $('#network-connection').removeClass('succeed').addClass('failed');
  }


  // send request to eedomus to verifiy connectivity to the cloud
  $.ajax({
    url:'wan.php',
    method:'GET',
    use_local:false,
    dataType:'json',
    success: function(cnx_status_eedomus){
        if(cnx_status_eedomus.status == 1){
          $('#eedomus-cloud').removeClass('unknown');
          $('#eedomus-cloud').removeClass('failed').addClass('succeed');
        }  
    },
    error: function(){
        $('#eedomus-cloud').removeClass('unknown');
        $('#eedomus-cloud').removeClass('succeed').addClass('failed');
    }
  });


  // display box-cloud and box-lan
  $('.box_name').text('pour '+box_name_);

  // send request to eedomus to verifiy connectivity to the cloud
  $.ajax({
    url:'controller_heartbeat.php',
    method:'GET',
    data:{
      controller_id:box_id_
    },
    use_local:false,
    dataType:'json',
    complete: function(){},
    success: function(stat){
        if (stat.status == 1){
          $('#box-cloud').removeClass('unknown')
          $('#box-cloud').removeClass('failed').addClass('succeed');
        }else{
          $('#box-cloud').removeClass('unknown');
          $('#box-cloud').removeClass('succeed').addClass('failed');
        }
    },
    error: function(){}
  });

  if ( box_lan_ip != ''){
      $('#box-lan').removeClass('failed').addClass('succeed');
  }else{
      $('#box-lan').removeClass('succeed').addClass('failed');
  }

});
  

  $('#to-home-diagnostic').on('click',function(){
    $.mobile.changePage("#home");
    return false;
  });

//= = = = = = = = = = = Map et géolocalisation
//= = = = = = = = = = = = = = = = = = = = = = = =
$(document).on('pagecreate','#map-page',function(){
    // google.maps.event.addDomListener(window, 'load', initFullMap);
    console.log(temp);
    full_map();
});

$('#map-page').on('pageinit', function() {
    var frequence;
    var duree;
    $('#freq').on('keyup', function(){
      frequence = parseFloat($('#freq').val());
      if(isNaN(frequence) == true){
        $('#freq').val(1);
      }else{
        if(frequence < 0){
          $('#freq').val(1)
        }
        if(frequence > 60){
          $('#freq').val(60)
        }  
      }
    });

    $('#duree').on('keyup', function(){
      duree = parseFloat($('#duree').val());
      if(isNaN(duree) == true ){
        $('#duree').val(1);
      }else{
        if(duree < 0){
          $('#duree').val(1)
        }
        if(duree > 60){
          $('#duree').val(60)
        }
      }
    });

    $('#locate-once').on('tap',function(){
      console.log(latitude+' - '+longitude+' - '+temp.controller_geo_id);
      state_locate_more = false;
      $.ajax({
        url: 'direct_exec.php',
        data:{
            last_action: latitude +','+longitude,
            controller_module_id: temp.controller_geo_id
        },        
        method: 'GET',
        use_local: false,
        dataType: 'json',
        success:function(response){
          console.log('success ! ' +response);
        },
        error:function(x,y,z){
          console.log('textStatus :'+ y +' | ErrorThrown :' + z);
        }
      });

      full_map();

      return false;
  });


  $('#locate-more').on('tap',function(){
    console.log('there');
    
    $('#follow').hide();
    $('#not_follow').show();
    
    state_locate_more = true;
    startTime = new Date().getTime();

    full_map()
    
    $('#interval').popup('close');

    return false;
  });

  $('#not_follow').on('tap', function(){

    $('#not_follow').hide();
    $('#follow').show();
    state_locate_more = false;
  });

});

setInterval(function(){
  if(state_locate_more ==true){
    console.log('loc more tru');
    $.ajax({
      url: 'direct_exec.php',
      data:{
          last_action: latitude +','+longitude,
          controller_module_id: temp.controller_geo_id
      },        
      method: 'GET',
      use_local: false,
      dataType: 'json',
      success:function(response){
        console.log('success ! ' +response);
      },
      error:function(x,y,z){
        console.log('textStatus :'+ y +' | ErrorThrown :' + z);
      }
    });

    full_map();

    if(new Date().getTime() - startTime > $('#duree').val()*60*60*1000 ){
      clearInterval(interval);
      state_locate_more = false;
      console.log('fin interval');
      return;
    }
  }else{
    console.log("lmf");
  }
},$('#freq').val()*60*1000);

function full_map() {
  var geoloc = navigator.geolocation;
  geoloc.getCurrentPosition(success_map, failure_map);
  
  function success_map(positions){
    latitude = positions.coords.latitude;
    longitude = positions.coords.longitude;
    var map = new google.maps.Map(document.getElementById('map-wrap'), {
      center: {lat:latitude, lng: longitude},
      zoom: 12
    });
    var marker = new google.maps.Marker({
          map: map, 
          position: new google.maps.LatLng(latitude, longitude)
    });
  }

  function failure_map(){
    alert("Echec de la géolocalisation.")
  }

}