module.exports = (grunt) ->
    grunt.initConfig(
        pkg: grunt.file.readJSON("package.json")
        clean:
            typescript: ["public/js/*"]
            less: ["public/css/*"]
        typescript:
            build:
                src: "ts/**/*.ts"
                dest: "public/js/tron.js"
                options:
                    basePath: "ts"
        less:
            build:
                src: "less/*.less"
                dest: "public/css/style.css"
                options:
                    sourceMapBasepath: "less"
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
    grunt.registerTask("default", ["clean", "typescript", "less"])
    grunt.registerTask("css", ["clean:less", "less"])
