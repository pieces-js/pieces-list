exports.config =
  conventions:
    assets: /(assets|vendor\/assets)/
  modules:
    wrapper: (path, data) ->
      if /^(vendor|node_modules|bower_components)/.test(path)
        data
      else
        path = path.replace(/^app\//, '').replace(/\.[^\.]+$/,'')
        unless /^pi(\.|$)/.test(path)
          path = 'pi/'+path
        """
          require.define({'#{path}': function(exports, require, module) {
            #{data}
          }});\n\n
        """
  paths:
    public: 'public'
  server: 
    path: 'app.js' 
    port: 3334
    base: '/'
    run: yes
  files:
    javascripts:
      defaultExtension: 'coffee'
      joinTo:
        'js/pieces.list.js': /^(app\/pi\.list\.js|app\/(components|plugins|controllers|views))/
        'js/vendor.js': /^(bower_components|vendor)[\\/](?!test)/
        'test/js/test.js': /^test/
        'test/js/test-vendor.js':  /^vendor[\\/](?=test)/
    stylesheets:
      defaultExtension: 'sass'
      joinTo:
        'test/stylesheets/test.css': /^(test|vendor[\\/](?=test))/
  plugins:
    uglify:
      mangle: 
        toplevel: false
      ignored: /^(bower_components|vendor|test)/
    autoprefixer:
      browsers: ["last 1 version", "> 1%", "ie 9"]