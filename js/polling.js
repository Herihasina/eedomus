var polling = {

  cm_list: [],
  uuid: null,
  prev_page: null,
  current_page: null,
  time: null,
  locked: false,
  last_polling_on_lan: null,

  setCmList: function(data) {
    this.cm_list = data;
  },

  setCurrentPage: function(data) {
    this.current_page = data;
  },

  setPrevPage: function(data) {
    this.prev_page = data;
  },

  setTime: function(data) {
    this.time = data;
  },

  start: function () {
    //console.log('start polling: '+this.cm_list.join(', '));
    if (this.locked)
    {
      window.setTimeout(function() { polling.start() }, 100);
      return;
    }
    var uuid = XDate().getTime();
    this.uuid = uuid;
    this.poll(uuid);
  },

  poll: function(uuid) {
    if (uuid != this.uuid || this.cm_list.length < 1)
    {
      return;
    }

    $.ajax({
      url: 'json_last_values.php',
      use_local: true,
      data: { cm_list: this.cm_list.join(',') },
      timeout: 2500,
      success: this.refreshValues,
      error: function() {
        if (on_lan)
        {
          set_on_lan_status(false);
        }
      },
      complete: function() {
        window.setTimeout(function() { polling.poll(uuid) }, polling.time);
      }
    });
  },

  stop: function () {
    //console.log('stop polling');
    this.uuid = null;
  },

  lock: function () {
    this.locked = true;
  },

  unlock: function () {
    window.setTimeout(function() { polling.locked = false; }, 1500)
  },

  refreshValues: function (data)
  {
    if (on_lan)
    {
      polling.last_polling_on_lan = XDate().getTime();
    }
    var need_rebuild_widgets = false;
    var need_rebuild_periph = false;

    $.each(data, function(i, value) {
      
      var controller_module_id = value[0];
      var periph = periphs[controller_module_id];

      if (controller_module_id == 0)
      {
        // la 1ère ligne est le temps étalon (le now vu du serveurs)
        now_time = new XDate(value[1]);
        unread_notification = value[3];
        unread_first_message_id = value[4];
        user_ip = value[6];
				// if we have to show the IOT comissioning screen
        return checkIOTcomissioning(unread_first_message_id);
      }

      if (periph != null)
      {
        if (value[4] != '' && value[4] != 0)
        {
          // Check if we have to update macro
          update_macro(controller_module_id, value[4], value[7]);
          $('span[data-macro-id="'+value[4]+'"]').html(value[7]);
        }
        if (periph.last_value_change != value[2] || periph.active_macro != value[4] || periph.last_action !== value[5])
        {
          periph.last_value = value[1];
          periph.last_value_change = value[2];
          periph.active_macro = value[4];
          periph.last_action = value[5];
          
          need_rebuild_widgets = true;

          if (polling.current_page == 'periph_page' || polling.current_page == 'favorite_page')
          {
            need_rebuild_periph = true;
          }
        }
        else if (polling.current_page == 'widgets_page')
        {
          // Just update delay
          $('a[data-controller-id="'+controller_module_id+'"]>p>span').html(getNiceDelay(periph.last_value_change));
        }
      }
    });

    if (need_rebuild_widgets)
    {
			rebuildCurrentWidgets();
    }
    if (need_rebuild_periph)
    {
      //console.log('rebuild periph');
      build_periph( $('#periph_page').data('controller-module-id'));
    }
  }
}


var main_polling = {

  last_update: null,
  uuid: null,

  start: function() {
    var uuid = XDate().getTime();
    this.uuid = uuid;
    this.poll(uuid);
  },

  stop: function() {
    this.uuid = null;
  },

  poll: function(uuid) {
    if (uuid != this.uuid)
    {
      return;
    }

    $.ajax({
      url: 'json_last_values.php',
      use_local: true,
      data: { check_update: 1 },
      success: this.refreshValues,
      error: function() {
        if (on_lan)
        {
          set_on_lan_status(false);
        }
      },
      complete: function() {
        window.setTimeout(function() { main_polling.poll(uuid) }, 10000);
      }
    });
  },

  refreshValues: function(data) {
    if (data && data[0] && data[0][7])
    {
      var last_update = data[0][7];

      if (main_polling.last_update != null && main_polling.last_update != last_update)
      {
        get_json_panel_list();
      }
      main_polling.last_update = last_update;
    }
  }
}

var lan_polling = {
  uuid: null,

  start: function() {
    if (webapp_mode == 'lan')
    {
      return;
    }
    var uuid = XDate().getTime();
    this.uuid = uuid;
    this.poll(uuid);
  },
  stop: function() {
    this.uuid = null;
  },
  poll: function(uuid) {
    if (uuid != this.uuid)
    {
      return;
    }
    if (!polling.last_polling_on_lan || polling.last_polling_on_lan < XDate().addSeconds(-6).getTime())
    {
      check_local_connection();
    }
    window.setTimeout(function() { lan_polling.poll(uuid) }, 6000);
  }
}
