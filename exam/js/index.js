Vue.createApp({
    data(){
        return {
            subject:{
                title:"인터페이스 구현",
                date:"2023-04-13",
            },
            subList:[
                {no:1, type:"서술형", count:3, begin:"09:30", end:"11:30", progress:0, remain:0},
                {no:2, type:"평가자 체크리스트", count:1, begin:"09:30", end:"11:30", progress:0, remain:0},
            ],
            noticeList:[
                "답안이 공백일 경우 0점 처리됩니다",
                "평가 완료 전까지 이동할 수 없습니다",
                "정해진 쉬는 시간 외에 다른 층으로 이동할 수 없습니다",
                "질문이 있을 경우 강사에게 문의 바랍니다"
            ],
            now:moment(),
            styles:{
                clear:{"color":"gray"},
                almost:{"color":"red"},
                remain:{"color":"black"}
            },
        };
    },
    computed:{
        nowFormat(){
            return this.now.format("YYYY-MM-DD dddd HH:mm:ss");
        },
    },
    watch:{
        
    },
    methods:{
        strFormat(str) {
            return moment(str, "yyyy-MM-dd").format("y년 M월 d일 dddd");
        },
        timeFormat(value) {
            if(value < 0) return "평가 종료";
            return moment.utc(value * 1000).format('H시간 m분 s초');
        }
    },
    created(){
        this.now = moment();

        setInterval(()=>{
            this.now = moment();

            this.subList.forEach((s)=>{
                const beginObj = moment(s.begin, 'HH:mm');
                const endObj = moment(s.end, 'HH:mm');
                const examDuration = moment.duration(endObj.diff(beginObj));
                const timeDuration = moment.duration(this.now.diff(beginObj));
                const total = parseInt(examDuration.asSeconds());
                const current = parseInt(timeDuration.asSeconds());
                const percent = Math.max(Math.min(100, current * 100 / total), 0);
                s.progress = percent;
                s.remain = total - current;
            });
        }, 1000);
    },
}).mount("#app");
