
exports.index = function(req, res){
  res.send('channel index');
};

exports.new = function(req, res){
  res.send('new channel');
};

exports.create = function(req, res){
  res.send('create channel');
};

exports.show = function(req, res){
  res.send('show channel ' + req.params.channel);
};

exports.edit = function(req, res){
  res.send('edit channel ' + req.params.channel);
};

exports.update = function(req, res){
  res.send('update channel ' + req.params.channel);
};

exports.destroy = function(req, res){
  res.send('destroy channel ' + req.params.channel);
};