import dayjs from 'dayjs'

export const fmtTime = (iso: string) => dayjs(iso).format('YYYY-MM-DD HH:mm:ss')
