#!/usr/bin/env python

import logging
import os
import urllib
import urllib2

import boto

import tornado.auth
import tornado.escape
import tornado.httpserver
import tornado.ioloop
import tornado.options
import tornado.web

from tornado.options import define, options

define("port", default=8888, help="run on the given port", type=int)


class Application(tornado.web.Application):
  def __init__(self):
    handlers = [
      (r"/", MainHandler),
      (r"/auth/login", AuthHandler),
      (r"/auth/logout", LogoutHandler),
      (r"/grab/(.+)", GrabHandler),
    ]
    settings = dict(
      cookie_secret="32oETzKXQAGaYdkL5gEmGeJJFuYh7EQnp2XdTP1o/Vo=",
      login_url="/auth/login",
      template_path=os.path.join(os.path.dirname(__file__), "templates"),
      static_path=os.path.join(os.path.dirname(__file__), "static"),
    )
    tornado.web.Application.__init__(self, handlers, **settings)


class BaseHandler(tornado.web.RequestHandler):
  def get_current_user(self):
    user_json = self.get_secure_cookie("user")
    if not user_json: return None
    return tornado.escape.json_decode(user_json)


class MainHandler(BaseHandler):
  @tornado.web.authenticated
  def get(self):
    # name = tornado.escape.xhtml_escape(self.current_user["name"])
    self.render("index.html")


class GrabHandler(BaseHandler):
  @tornado.web.authenticated
  def get(self, url):
    try:
      if not url.startswith('http://'):
        raise

      url = url.strip()
      url = url.replace('http://', '')
      safe_url = urllib.quote(url)
      logging.info('safe_url: %s.' % ('http://' + safe_url))
      image = urllib2.urlopen('http://' + safe_url).read()
      self.write(image)
    except:
      raise tornado.web.HTTPError(404)


class AuthHandler(BaseHandler, tornado.auth.GoogleMixin):
  @tornado.web.asynchronous
  def get(self):
    if self.get_argument("openid.mode", None):
      self.get_authenticated_user(self.async_callback(self._on_auth))
      return
    self.authenticate_redirect()

  def _on_auth(self, user):
    if not user:
      raise tornado.web.HTTPError(500, "Google auth failed")
    self.set_secure_cookie("user", tornado.escape.json_encode(user))
    self.redirect("/")


class LogoutHandler(BaseHandler):
  def get(self):
    self.clear_cookie("user")
    self.redirect("/")


def main():
  tornado.options.parse_command_line()
  http_server = tornado.httpserver.HTTPServer(Application())
  http_server.listen(options.port)
  tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
  main()
