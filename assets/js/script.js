$(document).ready(function() {
  var url = 'https://status.app.dnt.no/api/v1/checks';

  $.getJSON(url).done(status);

  var $panel = $('#panel');
  var $apps = $('#apps');
  var $services = $('#services');

  function status(data) {
    data.checks = data.checks.map(function(check) {
      check.class = check.status === 'up' ? 'operational' : 'major outage';
      check.text = check.status === 'up' ? 'operativ' : 'ute av drift';
      check.category = check.tags.reduce(function(cat, tag) {
        return tag.name === 'service' ? 'service' : cat;
      }, 'app');

      // check time since last outage
      if (check.status === 'up' && Date.now() - (check.lasterrortime * 1000) <= 86400000) {
        check.class = 'degraded performance';
        check.text = 'ustabil';
      }

      return check;
    });

    var status = data.checks.reduce(function(status, check) {
      return check.status !== 'up' ? 'major outage' : status;
    }, 'operational');

    $panel.attr('class', 'panel ' + status);
    $panel.html(status === 'operational' ? 'Alle systemer er operative.' : 'Ett eller flere systemer ute av drift');

    data.checks.forEach(function(item) {
      var $here = item.category === 'service' ? $services : $apps;

      var name = item.name;
      var clas = item.class;
      var text = item.text;

      $here.append('<li>' + name + ' <span class="status ' + clas + '">' + text + '</span></li>') });
  };
});
