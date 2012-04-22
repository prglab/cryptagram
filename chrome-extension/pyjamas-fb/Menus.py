from pyjamas.ui.Sink import Sink, SinkInfo
from pyjamas.ui.MenuBar import MenuBar
from pyjamas.ui.MenuItem import MenuItem
from pyjamas import DOM

class Menus(Sink):
  def __init__(self):
    Sink.__init__(self)
    self.context.setContextMenu(self)

  def onContextMenu(self, sender):
    event = DOM.eventGetCurrentEvent()
    subMenu = MenuBar(True)
    subMenu.addItem("<code>Code</code>", True, self)
    subMenu.addItem("<strike>Strikethrough</strike>", True, self)
    subMenu.addItem("<u>Underlined</u>", True, self)

    x = DOM.eventGetClientX(event) + 2
    y = DOM.eventGetClientY(event) + 2

    popup = ContextMenuPopupPanel(subMenu)
    popup.showAt(x, y)

  def execute(self):
    Window.alert("Thank you for selecting a menu item.")

def init():
  return SinkInfo("Menus", "The GWT <code>MenuBar</code> class makes it easy to build menus, including cascading sub-menus.", Menus)
