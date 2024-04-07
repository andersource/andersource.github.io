import sys
import traceback
from browser import document, timer, window

FIRST_TIME = True
def inform(*args):
    # document["status-info"].html = "".join(args)
    _write(*args)

def _write(*args):
    document["turtle-print-output"].html += "".join(args)
def __write(*args):
    document["turtle-print-output"].html += '<span class="error">' + "".join(args) + "</span>"

sys.stdout.write = _write
sys.stderr.write = __write

def clear_print():
    document["turtle-print-output"].html = ""


def run_code(ev):
    global FIRST_TIME
    if FIRST_TIME:
        FIRST_TIME = False
    else:
        clear(ev)
    document["run"].class_name = "btn-disabled"
    # delay to allow updated DOM with above text to be shown.
    timer.set_timeout(exec_code, 1)


document["run"].bind("click", run_code)


def prep_code(code, canvsize):
    return f"""
from browser import document
import turtle
turtle.set_defaults(
    turtle_canvas_wrapper = document['turtle-div'],
    canvwidth={canvsize}, canvheight={canvsize}
)
turtle.speed(0)
def fill_background(color):
    turtle.fillcolor(color)
    turtle.penup()
    turtle.goto(-251, -251)
    turtle.begin_fill()
    turtle.goto(251, -251)
    turtle.goto(251, 251)
    turtle.goto(-251, 251)
    turtle.goto(-251, -251)
    turtle.end_fill()
    turtle.goto(0, 0)
    turtle.pendown()
turtle.bgcolor = fill_background
turtle.bgcolor("#ffffff")
{code}
turtle.hideturtle()
turtle.done()
"""


def exec_code():
    _code = prep_code(document.codeEditor.getValue(), document.turtleWidth)

    document['turtle-div'].removeAttribute('hidden')
    try:
        exec(_code)
        timer.set_timeout(post_exec, 1)
    except Exception as ex:
        try:
            traceback.print_exc()
            document['turtle-print-output'].removeAttribute('hidden')
        except:
            print("could not print traceback")


def post_exec():
    document['turtle-print-output'].setAttribute('hidden', 'hidden')
    window.draw(window.evaluate)


def get_canvas_context(canvas):
    return canvas.getContext('2d')


def delayed_clear():
    from turtle import restart
    restart()
    document["run"].class_name = "btn-enabled"
    clear_print()


def clear(ev):
    global FIRST_TIME
    if FIRST_TIME:
        FIRST_TIME = False
        document["run"].class_name = "btn-disabled"
    # delay to allow updated DOM with above text to be shown.
    timer.set_timeout(delayed_clear, 1)
