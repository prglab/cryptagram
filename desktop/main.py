#!/usr/bin/env python
import os
import logging
import sys
import time
import threading

import Tkinter as tk
from Tkinter import *

logging.basicConfig(level=logging.INFO,
                    stream = sys.stdout,
                    #filename='py2app.tierney.log',
                    format = '%(asctime)-15s %(levelname)8s %(module)10s '\
                      '%(threadName)10s %(thread)16d %(lineno)4d %(message)s')

class StatusBar(tk.Frame):
  def __init__(self, master):
    tk.Frame.__init__(self, master)
    self.variable=tk.StringVar()
    self.label=tk.Label(self, bd=1, anchor=tk.W,
                        textvariable=self.variable,
                        font=('arial',12,'normal'))
    self.variable.set('Status Bar')
    self.label.pack(fill="both", expand="yes")
    self.pack()

  def set(self, set_string):
    self.variable.set(set_string)

  def clear(self):
    self.variable.set('')

class Codec(threading.Thread):
  def __init__(self, parent_frame, passed_values, status_bar):
    threading.Thread.__init__(self)
    self.daemon = True
    self.parent_frame = parent_frame
    self.passed_values = passed_values
    self.status_bar = status_bar
    self.password = None

  def set_password(self, password):
    logging.info('Set password %s' % password)
    self.password = password

  def run(self):
    while True:
      if self.password:
        break
      logging.info('Waiting for password')
      time.sleep(1)

    logging.info('Got password')
    for passed_value in self.passed_values:
      if os.path.isdir(passed_value):
        self.status_bar.set(passed_value)
        logging.info('Treat %s like a directory.' % passed_value)
      else:
        self.status_bar.set(passed_value)
        logging.info('Treat %s like a file.' % passed_value)
    logging.info('Done so quitting.')
    self.parent_frame.done()

class Application(Frame):
  def __init__(self, master=None, passed_values=None):
    self.passed_values = passed_values
    self.password = None

    Frame.__init__(self, master)

    labelframe = LabelFrame(master, text="Password for Photos")
    labelframe.pack(fill="both", expand="yes")

    self.contents = Entry(labelframe)
    self.contents.pack(fill='both', expand='yes')
    self.contentstext = StringVar()
    self.contentstext.set("Type password here. Hit Enter.")
    self.contents["textvariable"] = self.contentstext
    self.contents.bind('<Key-Return>', self.print_contents)

    status_frame = LabelFrame(master, text="Status")
    status_frame.pack(fill="both", expand="yes")
    self.sb = StatusBar(status_frame)
    self.sb.pack()
    self.sb.clear()

    # Should allow for both selecting files to encrypt and drag and drop.
    self.sb.set('Multiple lines\nWaiting for password...')

    self.pack()
    self.createWidgets()

  def say_hi(self):
    print "hi there, everyone!"

  def createWidgets(self):
    self.hi_there = Button(self)
    self.hi_there["text"] = "Choose Files"
    self.hi_there["command"] = self.say_hi
    self.hi_there.pack({"side": "left"})

    self.hi_there2 = Button(self)
    self.hi_there2["text"] = "Choose Folder"
    self.hi_there2["command"] = self.say_hi
    self.hi_there2.pack({"side": "left"})

    self.QUIT = Button(self)
    self.QUIT["text"] = "Quit"
    self.QUIT["fg"]   = "red"
    self.QUIT["command"] =  self.quit

    self.QUIT.pack({"side": "left"})

  def print_contents(self, event):
    self.password = self.contents.get()
    logging.info("hi. contents of entry is now ----> %s" % self.password)
    self.codec.set_password(self.password)

  def codec_start(self):
    self.codec = Codec(self, self.passed_values, self.sb)
    self.codec.start()

  def done(self):
    logging.info('Done called')

def main(argv):
  logging.info(argv)

  passed_values = argv[1:]

  root = Tk()
  w = root.winfo_screenwidth()
  h = root.winfo_screenheight()
  rootsize = (400, 150) # tuple(int(_) for _ in root.geometry().split('+')[0].split('x'))
  x = w/2 - rootsize[0]/2
  y = h/2 - rootsize[1]/2
  root.geometry("%dx%d+%d+%d" % (rootsize + (x, y)))

  app = Application(master=root, passed_values = passed_values)
  app.codec_start()
  app.mainloop()
  root.destroy()

if __name__=='__main__':
  main(sys.argv)
