#!/usr/bin/env python

from Tkinter import *
import time

class Application(Frame):
    def say_hi(self):
        print "hi there, everyone!"

    def createWidgets(self):
        self.QUIT = Button(self)
        self.QUIT["text"] = "QUIT"
        self.QUIT["fg"]   = "red"
        self.QUIT["command"] =  self.quit

        self.QUIT.pack({"side": "left"})

        self.hi_there = Button(self)
        self.hi_there["text"] = "Hello",
        self.hi_there["command"] = self.say_hi

        self.hi_there.pack({"side": "left"})

    def __init__(self, master=None):
        Frame.__init__(self, master)
        self.pack()

        self.entrythingy = Entry()
        self.entrythingy.pack()

        # here is the application variable
        self.contents = StringVar()
        # set it to some value
        self.contents.set("Password")
        # tell the entry widget to watch this variable
        self.entrythingy["textvariable"] = self.contents

        # and here we get a callback when the user hits return.
        # we will have the program print out the value of the
        # application variable when the user hits return
        self.entrythingy.bind('<Key-Return>',
                              self.print_contents)

        self.createWidgets()

        # Wait for password
        self.password = None
        while not self.password:
          time.sleep(1)

        for passed_value in self.passed_values:
          if os.path.isdir(passed_value):
            logging.info('Treat %s like a directory.' % passed_value)
          else:
            logging.info('Treat %s like a file.' % passed_value)


    def print_contents(self, event):
      self.password = self.contents.get()
      logging.info("hi. contents of entry is now ----> %s" % self.password)


root = Tk()
app = Application(master=root)
app.mainloop()
root.destroy()
