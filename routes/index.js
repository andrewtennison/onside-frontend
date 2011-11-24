/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Onside', cssPath: '' })
};

exports.demo1 = function(req, res){
  res.render('demo1', { title: 'Onside', cssPath: '.demo1' })
};