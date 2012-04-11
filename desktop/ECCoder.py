#!/usr/bin/env python
import rs
import threading

class ECCodeRunner(threading.Thread):
  PADDING = '}'

  def __init__(self, coder, in_queue, out_queue):
    self.coder = coder
    self.in_queue = in_queue
    self.out_queue = out_queue
    threading.Thread.__init__(self)

  def run(self):
    for order, encode, block in self.in_queue:
      #logging.info('%s %d.' % ('Encoding' if encode else 'Decoding', order))
      if encode:
        coded_block = self.coder.encode(block)
      else:
        coded_block = self.coder.decode(block).rstrip(self.PADDING)
      self.out_queue.put((order, coded_block))
    return


class ECCoder(object):
  PADDING = '}'

  def __init__(self, n, k, num_threads=1):
    self.codeword_length = n
    self.message_byte_length = k
    self.num_threads = num_threads
    self.coder = rs.RSCoder(self.codeword_length, self.message_byte_length)

  def _pad(self, s):
    if len(s) == self.message_byte_length:
      return s
    return s + (self.message_byte_length - len(s) \
                  % self.message_byte_length) * self.PADDING

  def _chunk(self, message, encode):
    if encode:
      chunk_length = self.message_byte_length
    else:
      chunk_length = self.codeword_length

    chunked = [message[i:i+chunk_length] for
               i in range(0, len(message), chunk_length)]

    for i, chunk in enumerate(chunked):
      if encode:
        chunked[i] = self._pad(chunk)
      else:
        chunked[i] = chunk

    return tuple(chunked)

  def _threaded_coder(self, message, to_encode):
    blocks = self._chunk(message, to_encode)
    to_code = [(i, to_encode, block) for i, block in enumerate(blocks)]
    num_blocks = int(math.ceil(len(to_code) / (1. * self.num_threads)))

    to_code_list = [to_code[i:i+num_blocks] for i in
                    range(0, len(to_code), num_blocks)]

    coded_queue = Queue.Queue()
    threads = []
    for i in range(FLAGS.threads):
      new_encoder = rs.RSCoder(self.codeword_length, self.message_byte_length)
      threads.append(ECCodeRunner(new_encoder, to_code_list[i], coded_queue))

    [t.start() for t in threads]
    [t.join() for t in threads]

    coded_list = []
    # print coded_queue
    while True:
      try:
        dequeued = coded_queue.get_nowait()
      except:
        break
      coded_list.append(dequeued)
    coded_list.sort()

    thread_coded = ''.join([e[1] for e in coded_list])
    return thread_coded

  def _single_coder(self, message, to_encode):
    blocks = self._chunk(message, to_encode)
    coded = ''
    for block in blocks:
      if to_encode:
        coded_block = self.coder.encode(block)
      else:
        coded_block = self.coder.decode(block).rstrip(self.PADDING)
      coded += coded_block
    return coded

  def encode(self, message):
    if self.num_threads > 1:
      return self._threaded_coder(message, True)
    else:
      return self._single_coder(message, True)

  def decode(self, message):
    if self.num_threads > 1:
      return self._threaded_coder(message, False)
    else:
      return self._single_coder(message, False)
