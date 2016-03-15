$(document).ready(function() {
  $.getJSON('https://status.app.dnt.no/api/v1/checks').done(status);

  var $panel = $('#panel');
  var $categories = {
    app: $('#apps'),
    service: $('#services'),
    payment: $('#payments'),
  };

  function status(data) {
    data.checks = data.checks.map(function(check) {
      check.class = check.status === 'up' ? 'operational' : 'major outage';
      check.text = check.status === 'up' ? 'operativ' : 'driftsavbrudd';
      check.category = check.tags.reduce(function(cat, tag) {
        switch (tag.name) {
          case 'payment':
            return 'payment';
          case 'service':
            return 'service';
          default:
            return cat;
        }
      }, 'app');

      // check time since last outage
      if (check.status === 'up' && Date.now() - (check.lasterrortime * 1000) <= 86400000) {
        check.class = 'degraded performance';
        check.text = 'degradert ytelse';
      }

      return check;
    });

    var status = data.checks.reduce(function(status, check) {
      return check.status !== 'up' ? 'major outage' : status;
    }, 'operational');

    if (!$panel.data('incident')) {
      $panel.attr('class', 'panel ' + status);
      $panel.html(status === 'operational' ? 'Alle systemer er operative.' : 'Ett eller flere systemer ute av drift');
    }

    data.checks.forEach(function(item) {
      var $here = $categories[item.category];

      var name = item.name;
      var clas = item.class;
      var text = item.text;

      $here.append('<li>' + name + ' <span class="status ' + clas + '">' + text + '</span></li>') });
  };

  $.getJSON('https://api.github.com/repos/Turistforeningen/status/issues?state=all').done(message);

  var $incidents = $('#incidents');

  function message(issues) {
    issues.forEach(function(issue) {
      var status_text = {
        operational: 'løst',
        investigating: 'undersøker',
        'major outage': 'driftsavbrudd',
        'degraded performance': 'degradert ytelse',
      };

      var status = issue.labels.reduce(function(status, label) {
        if (/^status:/.test(label.name)) {
          return label.name.replace('status:', '');
        } else {
          return status;
        }
      }, 'operational');

      var systems = issue.labels.filter(function(label) {
        return /^system:/.test(label.name);
      }).map(function(label) {
        return label.name.replace('system:', '')
      });

      if (issue.state == 'open') {
        $panel.data('incident', 'true');
        $panel.attr('class', 'panel ' + status);
        $panel.html('<a href="#incidents">' + issue.title + '</a>');
      }

      var html = '<div class="incident">\n';
      html += '<span class="date">' + datetime(issue.created_at) + '</span>\n';

      // status
      if (issue.state == 'closed') {
        html += '<span class="label operational float-right">løst</span>';
      } else {
        html += '<span class="label ' + status + ' float-right">';
          html += status_text[status];
        html += '</span>\n';
      }

      // systems
      for (var i = 0; i < systems.length; i++) {
        html += '<span class="label system float-right">' + systems[i] + '</span>';
      }

      html += '<hr>\n';
      html += '<span class="title">' + issue.title + '</span>\n';
      html += '<p>' + issue.body + '</p>\n';

      if (issue.state == 'closed') {
        html += '<p><em>Oppdatert ' + datetime(issue.closed_at) + '<br/>';
        html += 'Systemet er tilbake i normal drift.</p>';
      }

      html += '</div>';

      $incidents.append(html);
    });

    function datetime(string) {
      var datetime = string.split('T');

      var date = datetime[0];
      var time = datetime[1].replace('Z', '');

      return date + ' ' + time;
    };
  };
});
