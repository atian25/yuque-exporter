# yuque-exporter

用于批量导出语雀文档。

## 为什么？

语雀的定位改变为`创作工具`，而不在是`内容社区`，相应的新的付费策略，也会造成了免费用户无法继续用语雀作为自己的个人博客。（相关讨论[传送门](https://www.zhihu.com/question/562238887)）

因此我们需要有一个把创作完的文档发布到其他平台的工具，故抽空写了该项目，可以方便的把语雀的内容批量导出为本地 Markdown，从而可以进一步发布到 GitHub 等平台。

> 本项目开发过程中，也收到了语雀同学的不少指导和建议。


## 如何使用

需提前申请语雀 TOKEN，请参考[文档](https://www.yuque.com/yuque/developer/api#785a3731)。

```bash
$ npx yuque-exporter --token=<your token>
```

## 技术内幕

`调用语雀 API -> 存储所有元数据 -> 根据 TOC 构建本地目录 -> 文件内容处理（下载图片、替换链接等）`

https://www.yuque.com/yuque/developer/api

```bash
$ npm i

$ YUQUE_TOKEN=<your token> npm start

$ ls output
```


## TODO List

- 命令行工具
  - [ ] 提供命令行支持
- 目录结构
  - [x] ~~文件名用 slug 还是中文名？~~ 因为目录是中文的，先用全中文，回头提供配置
  - [ ] 文件名存在非法字符的特殊处理
  - [x] ~~草稿文件写入到 draft 目录~~ 草稿直接在根目录，方便相对链接
  - [x] 优化 TOC 的处理
  - [ ] 如何排序？
- 正文的处理
  - [x] 支持 frontmatter
  - [x] 下载图片及画板为本地文件
  - [x] 替换文档链接为相对链接
  - [ ] 替换多余的 HTML 标签，如 `<br/>`
- 增强特性
  - [ ] 支持多账号和团队文档的下载
  - [ ] 对 obsidian 的更多支持
- 其他
  - [ ] API 调用受限时提示用户（目前 5000 次/小时）
  - [ ] 单元测试
