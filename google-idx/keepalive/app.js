const { exec } = require('child_process')
const axios = require('axios')

// ============================================================
// Remote
const targetUrl = 'https://8080-firebase-us-1747877258236.cluster-2xfkbshw5rfguuk5qupw267afs.cloudworkstations.dev'
const ffOpenUrl = 'https://idx.google.com/us-51072006'
// Local
const projectDir = '/home/user/tw'
const vncPassword = 'vevc.firefox.VNC.pwd'
// ============================================================

let lock = false
let errorCount = 0
const containerName = 'idx'

// 启动容器的命令（带 2GB 内存限制）
const runCmd = `docker run -d --name=${containerName} \
  --restart=unless-stopped \
  -m 2g \
  -e VNC_PASSWORD=${vncPassword} \
  -e FF_OPEN_URL=${ffOpenUrl} \
  -p 5800:5800 \
  -v ${projectDir}/app/firefox/idx:/config \
  jlesage/firefox`

// 检查并重启容器
const keepalive = () => {
    console.log(`${new Date().toISOString()}, error: errorCount=${errorCount}`)
    if (errorCount >= 3 && !lock) {
        lock = true
        errorCount = 0
        console.log(`${new Date().toISOString()}, docker restart triggered, reset errorCount`)

        // 优先尝试 restart
        exec(`docker restart ${containerName}`, (err) => {
            if (err) {
                // 容器不存在时重新创建
                exec(`docker rm -f ${containerName} && ${runCmd}`, () => {
                    console.log(`${new Date().toISOString()}, docker recreated ${containerName}`)
                    setTimeout(() => { lock = false }, 30000) // 30 秒冷却
                })
            } else {
                console.log(`${new Date().toISOString()}, docker restarted ${containerName}`)
                setTimeout(() => { lock = false }, 30000) // 30 秒冷却
            }
        })
    }
}

// 每 20 秒探测一次远程 URL
setInterval(() => {
    axios.get(targetUrl).catch(error => {
        if (error.response) {
            const status = error.response.status
            if (status === 400) {
                errorCount = 0
                console.log(`${new Date().toISOString()}, success, errorCount=${errorCount}`)
            } else {
                errorCount++
                keepalive()
            }
        } else {
            errorCount++
            keepalive()
        }
    })
}, 20000)

// 每 3 秒检查容器是否存在，不存在就重建
setInterval(() => {
    if (!lock) {
        exec("docker ps --format '{{.Names}}'", (_, stdout) => {
            if (!stdout.includes(containerName)) {
                console.log(`${new Date().toISOString()}, docker recreate ${containerName} to keepalive`)
                exec(`docker rm -f ${containerName} && ${runCmd}`)
            }
        })
    }
}, 3000)
