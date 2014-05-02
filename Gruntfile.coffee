module.exports = (grunt) ->
    grunt.initConfig(
        pkg: grunt.file.readJSON("package.json")
        clean:
            build: ["build/**/*"]
        typescript:
            build:
                src: "**/*.ts"
                dest: "build/tron.js"
                options:
                    basePath: "src"
        copy:
            build:
                expand: true
                cwd: "src"
                src: ["**/*", "!**/*.ts", "!**/defs/**"]
                dest: "build"
            lib:
                expand: true
                src: "lib/**/*"
                dest: "build"
    )

    # Load plugins
    grunt.loadNpmTasks("grunt-contrib-clean")
    grunt.loadNpmTasks("grunt-contrib-copy")
    grunt.loadNpmTasks("grunt-typescript")

    # Tasks
    grunt.registerTask("default", ["clean", "typescript:build", "copy:build", "copy:lib"])
