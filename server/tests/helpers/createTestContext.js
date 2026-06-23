import { mkdtempSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

export function createTestContext() {
  const rootDir = mkdtempSync(join(tmpdir(), 'petlife-server-test-'))
  const dataDir = join(rootDir, 'data')
  const uploadDir = join(rootDir, 'uploads')
  const dbPath = join(dataDir, 'petlife.test.sqlite')

  mkdirSync(dataDir, { recursive: true })
  mkdirSync(uploadDir, { recursive: true })

  return {
    adminKey: 'test-admin-key',
    dbPath,
    dataDir,
    rootDir,
    uploadDir,
    cleanup() {
      rmSync(rootDir, { recursive: true, force: true })
    }
  }
}
