# 2021 Yearbook

http://www.bjuvintage.com/2021/

I led a small team of three college students to design and develop a companion website based on our school's yearbook.

## Features

- Figma web design based on printed yearbook
- Unique animated background on Home, Events, and Groups page using particles.js library
- Scrollspy on months navigation menu on Events page to update on scroll down
- Gulp.js render pipeline to build Pug.js and JSON files
- Search API using AWS Lambda

## Design Process

At the start of the fall semester, the print design team and photo team created the print yearbook.

![2021-mock-2](https://user-images.githubusercontent.com/17521691/185529747-4ca5ee28-7903-4926-b9c0-efba45eef702.jpg)
![2021 1](https://user-images.githubusercontent.com/17521691/185529754-492cc613-e1d1-4c42-aa18-88a07ab46be6.png)

We used this design as the basis for creating a website mockup in Figma.

![image](https://user-images.githubusercontent.com/17521691/185528491-06070146-d655-4ded-8c98-785fdac68de6.png)

## Development Process

This was the first year that I led the yearbook web team. The past years had used Python to render the JSON and Pug files. Because I am much more experience in JavaScript than Python, I rebuilt the entire render pipeline using Gulp.js.

```javascript
// Located at /gulpfile.js

function views() {
  return gulp.src(['src/views/*.pug', '!src/views/groups-*.pug'])
  .pipe(data(view => {
    const viewName = path.basename(view.path, '.pug')
    const jsonpath = './src/data/' + viewName + '.json'
    if (fs.existsSync(jsonpath)) {
      let json = fs.readFileSync(jsonpath)
      log.info(`JSON data ${jsonpath} matched with ${view.path}`)
      return JSON.parse(json)
    }
    else noop()
  }))  
  .pipe(pug())
  .on('end', () => log.info(`All views rendered`))
  .pipe(devEnv ? noop() : htmlmin({ collapseWhitespace: true }))
  .on('end', () => devEnv ? log.info(`HTML minify skipped for development environment`) : log.info(`HTML minified for production`))
  .pipe(gulp.dest(dist + '/'))
}
```
This was used to render a number of Pug files with data from JSON. For example, the Pug code could iterate over all of the groups in the yearbook to easily create the markup for the Groups page.
```pug
// Located at /src/views/groups.pug

section
    .boxes
      each group in groups
        a.box(href=`${group.name}.html`)= group.name
```
The main reason for using Pug and JSON was so that a number of group pages with different data could be created with one template. This one little bit of code could pre-render almost 70 subgroup pages.
```pug
// Located at /src/views/groups-detail.pug

block content
  .jumbotron.alternate
    .overlay#particles-js
      h1 GROUPS
  section 
    h2= name
    .container
      .goback
        a(href=`${group}.html`) <span><</span> Back to #{group}
      .img-fill
        img(src= img)
      h4#members Members
      .list
        each person in people
          p= person
 ```

## Things I Learned
- Using Gulp.js to create an entire pipeline to accomplish tasks
- Rendering Pug template files with JSON data
- Completing a major project from start to finish over several months
- Leading a team of several people

## Installing

You will need Node.js and NPM. After cloning the website, install dependencies:
```
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
