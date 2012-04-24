import Tkinter as tk
class StatusBar(tk.Frame):
    def __init__(self, master):
        tk.Frame.__init__(self, master)
        self.variable=tk.StringVar()
        self.label=tk.Label(self, bd=1, relief=tk.SUNKEN, anchor=tk.W,
                           textvariabl=self.variable,
                           font=('arial',16,'normal'))
        self.variable.set('Status Bar')
        self.label.pack(fill=tk.X)
        self.pack()

    def set(self, format, *args):
        self.label.config(text=format % args)
        self.label.update_idletasks()

    def clear(self):
        self.label.config(text="")
        self.label.update_idletasks()

root=tk.Tk()
d=StatusBar(root)
root.geometry('300x100')
root.mainloop()
