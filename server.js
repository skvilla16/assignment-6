const collegeDataModule = require("./modules/collegeData");
var HTTP_PORT = process.env.PORT || 8080;
var express = require("express");
var path = require("path");
var exphbs = require("express-handlebars");
var app = express();
app.use(express.urlencoded({ extended: true }));
app.engine(
  ".hbs",
  exphbs.engine({
    extname: ".hbs",
    defaultLayout: "main",
    helpers: { equal, navLink },
  })
);
app.set("view engine", ".hbs");
app.use("/static", express.static(path.join(__dirname, "public")));
app.use(function (req, res, next) {
  let route = req.path.substring(1);
  app.locals.activeRoute =
    "/" +
    (isNaN(route.split("/")[1])
      ? route.replace(/\/(?!.*)/, "")
      : route.replace(/\/(.*)/, ""));
  next();
});

function equal(lvalue, rvalue, options) {
  if (arguments.length < 3)
    throw new Error("Handlebars Helper equal needs 2 parameters");
  if (lvalue != rvalue) {
    return options.inverse(this);
  } else {
    return options.fn(this);
  }
}

function navLink(url, options) {
  return (
    "<li" +
    (url == app.locals.activeRoute
      ? ' class="nav-item active" '
      : ' class="nav-item" ') +
    '><a class="nav-link" href="' +
    url +
    '">' +
    options.fn(this) +
    "</a></li>"
  );
}

function handleStudents(req, res) {
  const course = req.query["courseId"];
  if (course) {
    collegeDataModule
      .getStudentsByCourse(course)
      .then(function (response) {
        if (response && response.length) {
          res.render("students", { students: response });
        } else {
          res.render("students", { message: "no results" });
        }
      })
      .catch(function () {
        res.render("students", { message: "no results" });
      });
  } else {
    collegeDataModule
      .getAllStudents()
      .then(function (response) {
        if (response && response.length) {
          res.render("students", { students: response });
        } else {
          res.render("students", { message: "no results" });
        }
      })
      .catch(function () {
        res.render("students", { message: "no results" });
      });
  }
}

function handleStudent(req, res) {
  const studentNum = req.params["studentNum"];
  if (studentNum) {
    let viewData = {};
    collegeDataModule
      .getStudentByNum(studentNum)
      .then(function (data) {
        if (data) {
          viewData["student"] = data;
        } else {
          viewData["student"] = null;
        }
      })
      .catch(function () {
        viewData["student"] = null;
      })
      .then(collegeDataModule.getCourses)
      .then(function (coursesData) {
        viewData["courses"] = coursesData;
        for (let i = 0; i < coursesData.length; i++) {
          if (coursesData[i].courseId == viewData.student.course) {
            viewData["courses"][i].selected = true;
          }
        }
      })
      .catch(function () {
        viewData.courses = [];
      })
      .then(function () {
        if (viewData.student == null) {
          res.status(404).send("Student Not Found");
        } else {
          res.render("student", { viewData });
        }
      });
  } else {
    res.status(404).send("Student Not Found");
  }
}

function handleCourses(req, res) {
  collegeDataModule
    .getCourses()
    .then(function (response) {
      if (response && response.length) {
        res.render("courses", { courses: response });
      } else {
        res.render("courses", { message: "no results" });
      }
    })
    .catch(function () {
      res.render("courses", { message: "no results" });
    });
}

function handleaddStudent(req, res) {
  const payload = req.body;
  collegeDataModule
    .addStudent(payload)
    .then(function () {
      res.redirect("/students");
    })
    .catch(function () {
      console.log("Error while aading student");
    });
}

function handleAddCourse(req, res) {
  const payload = req.body;
  collegeDataModule
    .addCourse(payload)
    .then(function () {
      res.redirect("/courses");
    })
    .catch(function () {
      console.log("Error while aading student");
    });
}

function handleCourseById(req, res) {
  const courseId = req.params["courseId"];
  collegeDataModule
    .getCourseById(courseId)
    .then(function (data) {
      if (data) {
        res.render("course", { course: data });
      } else {
        res.status(400).send("Course Not Found");
      }
    })
    .catch(function () {
      res.status(400).send("Course Not Found");
    });
}

function handleDeleteCourseById(req, res) {
  const courseId = req.params["courseId"];
  collegeDataModule
    .deleteCourse(courseId)
    .then(function () {
      res.redirect("/courses");
    })
    .catch(function () {
      res.status(500).send("Unable to Remove Course/Course Not Found");
    });
}

function handleDeleteStudentById(req, res) {
  const studentNum = req.params["studentNum"];
  collegeDataModule
    .deleteStudent(studentNum)
    .then(function () {
      res.redirect("/students");
    })
    .catch(function () {
      res.status(500).send("Unable to Remove Student/Student Not Found");
    });
}

function updateStudent(req, res) {
  const payload = req.body;
  collegeDataModule.updateStudent(payload).then(function () {
    res.redirect("/students");
  });
}

function updateCourse(req, res) {
  const payload = req.body;
  collegeDataModule.updateCourse(payload).then(function () {
    res.redirect("/courses");
  });
}

app.get("/students", handleStudents);
app.get("/student/:studentNum", handleStudent);
app.post("/students/add", handleaddStudent);
app.post("/courses/add", handleAddCourse);
app.get("/courses", handleCourses);
app.get("/course/:courseId", handleCourseById);
app.get("/course/delete/:courseId", handleDeleteCourseById);
app.get("/student/delete/:studentNum", handleDeleteStudentById);
app.post("/student/update", updateStudent);
app.post("/course/update", updateCourse);
app.get(["/", "/home"], function (req, res) {
  const home = path.join(__dirname, "views", "home");
  res.render(home);
});
app.get("/about", function (req, res) {
  const about = path.join(__dirname, "views", "about");
  res.render(about);
});
app.get("/htmlDemo", function (req, res) {
  const htmlDemo = path.join(__dirname, "views", "htmlDemo");
  res.render(htmlDemo);
});
app.get("/students/add", function (req, res) {
  const addStudent = path.join(__dirname, "views", "addStudent");
  collegeDataModule
    .getCourses()
    .then(function (data) {
      res.render(addStudent, { courses: data });
    })
    .catch(function () {
      res.render(addStudent, { courses: [] });
    });
});
app.get("/courses/add", function (req, res) {
  const addCourse = path.join(__dirname, "views", "addCourse");
  res.render(addCourse);
});

app.use((req, res, next) => {
  res.status(404).send("<h1>Page not found on the server</h1>");
});

// setup http server to listen on HTTP_PORT
collegeDataModule
  .initialize()
  .then(function () {
    app.listen(HTTP_PORT, () => {
      console.log("server listening on port: " + HTTP_PORT);
    });
  })
  .catch(function (err) {
    console.log(err);
  });
