'use babel'

import { CompositeDisposable } from 'atom'
import path from 'path'
import _ from 'lodash'
import fs from 'fs-plus'

export default {
  subscriptions: null,

  config: {
    notification: {
      type: 'boolean',
      default: true,
    },
  },

  activate(state) {
    this.subscriptions = new CompositeDisposable()
    this.subscriptions.add(atom.project.onDidChangePaths(paths => this.handler(paths)))
    this.handler(atom.project.getPaths())
  },

  deactivate() {
    this.subscriptions.dispose()
  },

  handler(paths) {
    if(_.isEmpty(paths)) return
    const hasEslintConf = paths.some(p => fs.listSync(p).some(f => {
      f = path.basename(f)
      if (f.indexOf('.eslintrc') === 0) return true
      if (f === 'package.json') return !_.isEmpty(require(path.join(p, f)).eslintConfig)
    }))
    if (!hasEslintConf) return
    const hasLocalEslint = paths.every(p => fs.existsSync(path.join(p, 'node_modules', 'eslint')))
    const disabledProviders = atom.config.get('linter.disabledProviders')
    if (hasLocalEslint) {
      if (disabledProviders) {
        if (disabledProviders.includes('ESLint')) _.pull(disabledProviders, 'ESLint')
      } else {
        atom.packages.enablePackage('linter-eslint')
      }
    } else {
      if (disabledProviders) {
        if (!disabledProviders.includes('ESLint')) disabledProviders.push('ESLint')
      } else {
        atom.packages.disablePackage('linter-eslint')
      }
    }
    atom.config.set('linter.disabledProviders', disabledProviders)
    if (hasEslintConf && atom.config.get('auto-eslint.notification')) atom.notifications.addSuccess(`ESLint ${hasLocalEslint ? 'Enabled' : 'Disabled'}`)
  },
}
