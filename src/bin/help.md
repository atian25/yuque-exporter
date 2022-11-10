yuque-exporter [...repos] [options]

export yuque docs to local

Usages:
  YUQUE_TOKEN=<your_token> yuque-exporter
  YUQUE_TOKEN=<your_token> yuque-exporter eggjs
  YUQUE_TOKEN=<your_token> yuque-exporter atian25/test atian25/blog

Commands:
  yuque-exporter [...repos]     export yuque docs to local             [default]
  yuque-exporter crawl          only crawl yuque docs meta
  yuque-exporter build          only build yuque docs with meta

Options:
  --help       Show help                                               [boolean]
  --version    Show version number                                     [boolean]
  --token      yuque token                                             [string] [default: process.env.YUQUE_TOKEN]
  --host       yuque host                                              [string] [default: "https://www.yuque.com"]
  --outputDir  output target directory                                 [string] [default: "./storage"]
  --clean      Whether clean the output target directory               [boolean] [default: false]

See https://github.com/atian25/yuque-exporter for more detail.
