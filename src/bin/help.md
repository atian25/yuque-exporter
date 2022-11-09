yuque-exporter [...repos] [options]

export yuque docs to local

Usages:
  yuque-exporter --token=<your_token>
  yuque-exporter --token=<your_token> eggjs
  yuque-exporter --token=<your_token> atian25/test atian25/blog
  YUQUE_TOKEN=<your_token> yuque-exporter

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
