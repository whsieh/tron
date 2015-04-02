module.exports = (grunt) ->
    grunt.initConfig(
        pkg: grunt.file.readJSON("package.json")
        clean:
            typescript: ["js/*"]
            less: ["css/*"]
        typescript:
            build:
                src: "ts/**/*.ts"
                dest: "js/tron.js"
                options:
                    basePath: "ts"
        less:
            build:
                src: "less/*.less"
                dest: "css/style.css"
                options:
                    sourceMapBasepath: "less"
        copy:
            build:
                expand: true
                cwd: "html/"
                src: "*.html"
                dest: "./"
                flatten: true
                filter: 'isFile'
        watch:
            build: {
                files: ["ts/**/*.ts", "less/**/*.less"]
                tasks: "default"
            }
    )

    # Load plugins
    grunt.loadNpmTasks("grunt-contrib-clean")
    grunt.loadNpmTasks("grunt-contrib-copy")
    grunt.loadNpmTasks("grunt-typescript")
    grunt.loadNpmTasks('grunt-contrib-less')
    grunt.loadNpmTasks('grunt-contrib-watch')

    # Tasks
    grunt.registerTask("default", ["clean", "typescript", "less", "copy"])
    grunt.registerTask("css", ["clean:less", "less"])
