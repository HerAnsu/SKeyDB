import fs from 'node:fs/promises'
import path from 'node:path'

import prettier from 'prettier'

async function formatJson(jsonValue, filePath) {
  const resolvedConfig = (await prettier.resolveConfig(filePath)) ?? {}
  return prettier.format(`${JSON.stringify(jsonValue)}\n`, {
    ...resolvedConfig,
    filepath: filePath,
  })
}

async function readUtf8IfExists(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8')
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return null
    }
    throw error
  }
}

export async function writeFormattedJsonIfChanged(filePath, jsonValue) {
  const formattedContent = await formatJson(jsonValue, filePath)
  const currentContent = await readUtf8IfExists(filePath)

  if (currentContent === formattedContent) {
    return {changed: false, formattedContent}
  }

  await fs.mkdir(path.dirname(filePath), {recursive: true})
  await fs.writeFile(filePath, formattedContent, 'utf8')

  return {changed: true, formattedContent}
}

export async function syncFormattedJsonDirectory(outputDir, fileEntries) {
  await fs.mkdir(outputDir, {recursive: true})

  const desiredEntries = Object.entries(fileEntries)
  const desiredNames = new Set(desiredEntries.map(([fileName]) => fileName))
  const written = []
  const skipped = []

  for (const [fileName, jsonValue] of desiredEntries) {
    const result = await writeFormattedJsonIfChanged(path.join(outputDir, fileName), jsonValue)
    if (result.changed) {
      written.push(fileName)
    } else {
      skipped.push(fileName)
    }
  }

  const removed = []
  for (const entry of await fs.readdir(outputDir, {withFileTypes: true})) {
    if (!entry.isFile() || desiredNames.has(entry.name)) {
      continue
    }
    await fs.rm(path.join(outputDir, entry.name), {force: true})
    removed.push(entry.name)
  }

  written.sort()
  skipped.sort()
  removed.sort()

  return {written, skipped, removed}
}
