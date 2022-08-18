# Vintage2021

### Getting Started

Install Node.js and NPM https://nodejs.org/en/

Run command in directory you want the repository to be in

```
git clone https://github.com/BJUVintage/Vintage2021.git
```
Enter repository and install dependencies
```
cd ./Vintage2021
npm install
```
Install gulp and pug globally to run tasks
```
npm install -g gulp
npm install -g pug-cli
```
Build the project
```
gulp build
```
Launch the website. This task will automatically compile and refresh your browser live while you work.
```
gulp watch
```
Deploy live test server
```
gulp testserver
```
To build for production set the NODE_ENV variable to production based on your system and build.
```javascript
// Windows Command Line
SET NODE_ENV=production
// Powershell
$env:NODE_ENV = 'production'
// Linux
NODE_ENV='production'

gulp build
```
Deploy production site
```javascript
// Add access key and secret access key from vintage passwords
aws configure 
// Run in root folder after building for production
aws s3 sync --delete dist s3://www.bjuvintage.com/2021
```

### Pug and Sass

We are using the Pug and Sass preprocessors in this project.

These tools provide additional functionality to html and css that are helpful in a large project like the vintage.

Check out some helpful documentation below.

[Pug](https://pugjs.org/language/attributes.html)

[Sass](https://sass-lang.com/guide)

### General Structure

`dist/` contains minified and compiled production code

`src/` contains source code

### Stylesheet Structure

`main.scss` should be the only Sass file from the whole code base not to begin with an underscore. This file should not contain anything but @import and comments.

`base/` animations, generic base code, typography, and utilies

`components/` single css file for each component (button, card, searchbar, etc.)

`/layout` header, footer, grid, navigation

`/pages` have a single scss for each specific page

`/abstracts` handles function, mixins, and variables

`/vendor` handles 3rd party css

See [sass-boilerplate](https://github.com/HugoGiraudel/sass-boilerplate)
