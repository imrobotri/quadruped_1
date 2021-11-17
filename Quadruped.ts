/**
 * Quadruped
 */
//% weight= 0 color=#0abcff icon="\uf201" block="Quadruped"
//% groups='["Set up","control","Additional steering gear control","Joint angle control"]'
namespace Quadruped {

    /**
     *TODO:Initialization: define the communication pins and related settings of microbit and adapter board (initialization is required before basic control, external steering gear control and joint control).After initial, the LED dot matrix screen of microbit cannot be used
     */
    //% group="Set up"
    //% blockGap=8
    //% blockId=Quadruped_init block="init"
    export function init(): void {
        SPI_Init()
    }
    //###return hexadecimal number||返回状态信息
    /**
    * TODO:Return information: return the status information of the robot itself (0x13 is trotting, 0x00 is idle, 0x01 is powered on, 0x06 is crawling, 0x08 is falling mode)
    */
    //% group="control"
    //% blockGap=8
    //% blockId=Quadruped_Status block="Status"
    export function Status(): number {
        return robot_mode;
    }
    //####Reset||复位
    /**
     *TODO:the movement speed and attitude angle are reset to 0
     */
    //% group="control"
    //% blockGap=8
    //% blockId=Quadruped_Reset block="Reset"
    export function Reset(): void {
        rc_spd_cmd_X = 0.00 //x_speed
        rc_spd_cmd_y = 0.00 //y_speed
        rc_att_rate_cmd = 0.00 // Turn to speed
        rc_spd_cmd_z = 0.00 //Altitude speed
        //rc_pos_cmd = 0.00 //height
        rc_att_cmd_x = 0.00 //Pitch
        rc_att_cmd_y = 0.00 //Side swing
        rc_att_cmd = 0.00 //Heading
    }

    /**
     * TODO: height adjustment of robot body (0-10 range adjustment, 0 is the lowest and 10 is the highest)
     */
    //% group="control"
    //% blockGap=8
    //% h.min=0.00 h.max=10.00
    //% blockId=Quadruped_Height block="Height %h"
    export function Height(h: number): void {
        rc_pos_cmd = h * 0.01
        SPI_Send()
    }
    //###Start||启动
    /**
     * TODO:the robot is powered on and enters the semi squatting state（Start sending instructions internally, and the basic control needs to start initialization start before other building blocks can be used)
     */
    //% group="control"
    //% blockGap=8
    //% blockId=Quadruped_Start block="Start"
    export function Start(): void {
        gait_mode = 4
        state = 1
        basic.pause(3000)
        //serial.writeNumber(3)
        while (1) {
            SPI_Send()
            if (robot_mode == 1) {
                for (let i = 0; i < 2; i++) {
                    SPI_Send()
                    basic.pause(100)
                }
                return
            }
            //serial.writeNumber(4)
        }
    }
    //###Quadruped Stand||站立
    /**
     * TODO:the machine enters standing mode（In trotting and crawling gait, you need to stop in place, you can add this building block to enter standing mode)
     */
    //% group="control"
    //% blockGap=8
    //% blockId=Quadruped_Stand block="Stand"
    export function Stand(): void {
        Standing()
    }
    //####Quadruped Fall recovery||摔倒恢复
    /**
     * TODO:automatically detect whether to enter fall mode, and then automatically enter fall recovery
     */
    //% group="control"
    //% blockGap=8
    //% blockId=Quadruped_Fall_recovery block="Fall recovery"
    export function Fall_re(): void {
        if (robot_mode != 0x08)
            return
        if (robot_mode == 0x08) {
            gait_mode = 0x07
            SPI_Send()
            robot_mode_1 = robot_mode
            while (robot_mode_1 != 0x07) {
                return
            }
        }
    }
    //###Heartbeat||心跳
    /**
     * TODO:continuously send the instruction information set before (to prevent machine communication loss)
     */
    //% group="control"
    //% blockGap=8
    //% blockId=Quadruped_Heartbeat block="Heartbeat"
    export function Heartbeat(): void {
        SPI_Send()
        //serial.writeNumber(10)
    }
    //###Stop||停止
    /**
     * TODO:enter the power-off mode and the fuselage squats down (internal stop sending command)
     */
    //% group="control"
    //% blockGap=8
    //% blockId=Quadruped_Stop block="Stop"
    export function Stop(): void {
        if (robot_mode == 13) {
            Standing()
        }
        if (robot_mode == 1 || robot_mode == 0X02) {
            rc_pos_cmd = 0.01
        }
        SPI_Send()
        basic.pause(50)
        SPI_Send()
        state = 0
    }
    //###gait||步态
    /**
     * TODO:two options: trot and crawl（Note: crawling gait can only be used when the fuselage is at the highest state)
     */
    //% group="control"
    //% blockGap=8
    //% blockId=Quadruped_Gait block="Gait | %g"
    export function Gait(g: gait): void {
        switch (g) {
            case gait.Trot:
                gait_mode = 0x01;
                while (1) {
                    SPI_Send()
                    if (robot_mode == 13) {
                        SPI_Send()
                        //serial.writeNumber(2)
                        return
                    }
                }
            case gait.Crawl:
                gait_mode = 0x03;
                while (1) {
                    SPI_Send()
                    if (robot_mode == 6) {
                        SPI_Send()
                        //serial.writeNumber(2)
                        return
                   }
                }
        }
        SPI_Send()
    }
    //###Movement direction and speed||运动方向与速度
    /**
    * TODO:forward and backward, left and right movement, left and right rotation speed control.Time in milliseconds
    */
    //% group="control"
    //% blockGap=8
    //% speed1.min=0.00 speed1.max=10.00
    //% time1.min=0 time1.max=255
    //% blockId=Quadruped_Control_s block="Control direction| %m|speed %speed1|time %time1"
    export function Control_s(m: Mov_dir, speed1: number, time1: number): void {
        let Sum_S = 0.00
        Sum_S = speed1 / 100.00
        SPI_Send()
        switch (m) {
            case Mov_dir.For:
                rc_spd_cmd_X = Sum_S; SPI_Send(); break;
            case Mov_dir.Bac:
                rc_spd_cmd_X = (-Sum_S); SPI_Send(); break;
            case Mov_dir.Turn_l:
                rc_att_rate_cmd = (speed1 * 5); SPI_Send(); break;
            case Mov_dir.Turn_r:
                rc_att_rate_cmd = (-speed1 * 5); SPI_Send(); break;
            case Mov_dir.Shift_l:
                rc_spd_cmd_y = (-Sum_S); SPI_Send(); break;
            case Mov_dir.Shift_r:
                rc_spd_cmd_y = Sum_S; SPI_Send(); break;
        }
        for (let e = 0; e < time1; e++) {
            SPI_Send()
            //basic.pause(50)
        }
    }
    //###Control angle||控制角度
    /**
    * TODO:angle control of left-right swing, head up, head down and left-right twist.Time in milliseconds
    */
    //% group="control"
    //% blockGap=8
    //% angle1.min=0.00 angle1.max=10.00
    //% time1.min=0 time1.max=255
    //% blockId=Quadruped_Control_a block="Control angle |%m|angle_size %angle1|time %time1"
    export function Control_a(m: Mov_ang, angle1: number, time1: number): void {
        switch (m) {
            case Mov_ang.Look_d:
                rc_att_cmd_x = angle1; break;
            case Mov_ang.Look_u:
                rc_att_cmd_x = (-angle1); break;
            case Mov_ang.L_swing:
                if (angle1 == 0) {
                    rc_att_cmd_y = 0; break;
                }
                else {
                    rc_att_cmd_y = angle1 + 10; break;
                }
            case Mov_ang.R_swing:
                if (angle1 == 0) {
                    rc_att_cmd_y = 0; break;
                }
                else {
                    rc_att_cmd_y = (-angle1) - 10; break;
                }
            case Mov_ang.Yaw_l:
                rc_att_cmd = angle1; break;
            case Mov_ang.Yaw_r:
                rc_att_cmd = -(angle1); break;
        }
        for (let e = 0; e < time1; e++) {
            SPI_Send()
            //basic.pause(50)
        }
    }

    //###Joint angle control||关节控制
    /**
    * TODO:select the corresponding leg, joint angle and whether to implement the command of the current building block
    */
    //% group="Joint angle control"
    //% blockGap=8
    //% blockId=Quadruped_Joint block="Joint angle control | %j|thigh %d|Calf %x|Side led %c| %site "
    export function Joint(j: Joints, d: number, x: number, c: number, site: sIte): void {
        switch (j) {
            case Joints.Left_fr: FL_d = d; FL_x = x; FL_c = c; break;
            case Joints.Left_hi: HL_d = d; HL_x = x; HL_c = c; break
            case Joints.Right_fr: FR_d = d; FR_x = x; FR_c = c; break
            case Joints.Right_hi: HR_d = d; HR_x = x; HR_c = c; break
        }
        if (site = 1)
            Joint_SPI_Send()
    }
    //###Joint Heartbeat||关节心跳
    /**
    * TODO:continuously send the previously set command information (to prevent machine communication loss)
    */
    //% group="Joint angle control"
    //% blockGap=8
    //% blockId=Joint_Heartbeat block="Joint Heartbeat"
    export function Joint_Heartbeat(): void {
            Joint_SPI_Send()
    }


    //###Ultrasound||超声波
    /**
    * TODO:Select the transmitting and receiving pins corresponding to ultrasonic, and select the unit of returned data
    */
    //% subcategory=sensor
    //% blockGap=8
    //% blockId=sensor_Model block="Ultrasound |tr %trig |re %echo | unit %unit"
    export function Ultrasound(trig: DigitalPin, echo: DigitalPin, unit: Unit, maxCmDistance = 500): number {
        // send pulse
        maxCmDistance = 500
        pins.setPull(trig, PinPullMode.PullNone);
        pins.digitalWritePin(trig, 0);
        control.waitMicros(2);
        pins.digitalWritePin(trig, 1);
        control.waitMicros(10);
        pins.digitalWritePin(trig, 0);
        // read pulse
        const d = pins.pulseIn(echo, PulseValue.High, maxCmDistance * 58);
        switch (unit) {
            case Unit.Centimeters: return Math.idiv(d, 58);
            case Unit.Inches: return Math.idiv(d, 148);
            default: return d;
        }
    }
    //###Infrared||红外
    /**
     * TODO:select the data receiving pin (return 1 to recognize the human body, 0 not recognized)
     */
    //% subcategory=sensor
    //% blockGap=8
    //% blockId=sensor_Infrared block="Infrared |mode %value |pin %pin"
    export function Infrared(pin: DigitalPin): number {
        pins.setPull(pin, PinPullMode.PullUp);
        return pins.digitalReadPin(pin);
    }
    //###Human body induction||人体感应
    /**
    * TODO:select the data receiving pin (return 1 to recognize the human body, 0 not recognized)
    */
    //% subcategory=sensor
    //% blockGap=8
    //% blockId=sensor_Human_Infrared block="Human Infrared |pin %pin |mode %value"
    export function Human_induction(pin: AnalogPin, value=50): number {
        let w = pins.analogReadPin(pin)
        if (w >= value)
            return 1
        return 0
    }
    //###GestureInit||手势初始化
    /**
    * IODO:gesture related pins, configuration settings(success: 0 failure: 255)
    */
    //% subcategory=sensor
    //% blockGap=8
    //% blockId=sensor_GestureInit block="GestureInit"
    export function GestureInit(): number {
        basic.pause(800);//等待芯片稳定
        if (GestureReadReg(0) != 0x20) {
            return 0xff;
        }
        for (let i = 0; i < Init_Register_Array.length; i++) {
            GestureWriteReg(Init_Register_Array[i][0], Init_Register_Array[i][1]);
        }
        GestureSelectBank(0);
        for (let i = 0; i < Init_Gesture_Array.length; i++) {
            GestureWriteReg(Init_Gesture_Array[i][0], Init_Gesture_Array[i][1]);
        }
        return 0;
    }
    //###GetGesture||获取手势
    /**
    * IODO:returns the value of gesture direction
    */
    //% subcategory=sensor
    //% blockGap=8
    //% blockId=sensor_GetGesture block="GetGesture"
    export function GetGesture(): number {

        let date = GestureReadReg(0x43);

        switch (date) {
            case GES_RIGHT_FLAG:
            case GES_LEFT_FLAG:
            case GES_UP_FLAG:
            case GES_DOWN_FLAG:
            case GES_FORWARD_FLAG:
            case GES_BACKWARD_FLAG:
            case GES_CLOCKWISE_FLAG:
            case GES_COUNT_CLOCKWISE_FLAG:
                break;
            default:
                date = GestureReadReg(0x44);
                if (date == GES_WAVE_FLAG) {
                    return 256;
                }
                break;
        }
        return date;
    }

    //###Select_gesture_as||选择手势为
    /**
    * IODO:defines the value of gesture direction
    */
    //% subcategory=sensor
    //% blockGap=8
    //% blockId=sensor_Select_gesture_as block="Select_gesture_as | %state"
    export function Select_gesture_as(state: gesture): number {
        return state;
    }

    //###Steering gear control||舵机控制
    /**
    * IODO:select the external control pin, PWM value range: 500-2500 (0 ° - 180 °), speed: the response speed of steering gear: 0-10 (0 is fast - 10 bit slow)
    */
    //% group="Additional steering gear control"
    //% blockGap=8
    //% h.min=0 h.max=3
    //% pwm.min=500 pwm.max=2500
    //% Gap.min=0 Gap.max=9
    //% blockId=sensor_Steering_gear block="Steering_gear| %h | PWM_value %pwm|Rotation speed %Gap"
    export function Steering_gear(h: number, pwm: number, Gap: number) {
        usb_send_cnt_1 = 0;

        ToSlaveBuf_1[usb_send_cnt_1++] = DaHeader_1; //head
        ToSlaveBuf_1[usb_send_cnt_1++] = SSLen - 2; //Fixed length
        ToSlaveBuf_1[usb_send_cnt_1++] = 2;  //function code

        ToSlaveBuf_1[usb_send_cnt_1++] = h;
        ToSlaveBuf_1[usb_send_cnt_1++] = pwm >> 8;
        ToSlaveBuf_1[usb_send_cnt_1++] = (pwm << 8) >> 8;
        ToSlaveBuf_1[usb_send_cnt_1++] = Gap;

        ToSlaveBuf_1[SSLen - 1] = DaTail_1;//Fixed length

        SG_SPI_Send()
    }

    //###Image recognition initialization||图像识别初始化
    /**
    * IODO:Image recognition internal related pins and initialization of settings
    */
    //% subcategory=sensor
    //% blockGap=8
    //% blockId=sensor_Image_ini block="Image recognition initialization"
    export function Image_init() {
        serial.setRxBufferSize(32)
    }

    //###QR code position return value||二维码位置返回值
    /**
    * IODO: returns the value of the QR code set, and the X, y, Z, XYZ axes are flipped (corresponding position and flipping angle)
    */
    //% subcategory=sensor
    //% blockGap=8
    //% blockId=sensor_QR_return block="QR code position return value| %data"
    export function QR_return(data: Position): number {
        Function_c = 0x04
        Function_s = 1
        Identify_send()
        Identify_receive()
        switch (data) {
            case Position.Content_V: return Identify_pattern; break;
            case Position.X_axis: return Identify_x; break;
            case Position.Y_axis: return Identify_x; break;
            case Position.Z_axis: return Identify_x; break;
            case Position.X_flip: return Identify_x; break;
            case Position.Y_flip: return Identify_x; break;
            case Position.Z_flip: return Identify_x; break;
            default: return 255
        }
    }

    //###Line patrol return||巡线返回
    /**
    * IODO:status (1 and 0 are returned, 1 is recognized, 0 is not recognized), recognition effect (pixel value size of recognition line is 0-19200), deviation angle (- 90 ° -- 0 ° -- 90 °), deviation X-axis position (- 160 - 0 - 160,) return value (float)
    */
    //% subcategory=sensor
    //% blockGap=8
    //% blockId=sensor_Line_return block="Line patrol return value| %x"
    export function Line_return(X: Line_Position): number {
        Function_c = 0x60
        Function_s = 3
        Identify_send()
        Identify_receive()
        switch (X) {
            case Line_Position.status: return Line_detect;
            case Line_Position.Re_effect: return Line_effect;
            case Line_Position.De_angle: return Line_angle;
            case Line_Position.De_position: return Line_position;
            default: return 255
        }
    }

    //###Ball return value||小球返回值
    /**
    * IODO:returns the return information of the graphic small ball, the recognition status (returns 1 and 0, 1 means recognized, 0 means unrecognized), the X and Y axis position of the ball center in the image, the two-dimensional width and height of the small ball, and the recognition effect (the higher the recognition effect, the distance of the small ball).Return value (float)
    */
    //% subcategory=sensor
    //% blockGap=8
    //% blockId=sensor_Ball_return block="Ball returnvalue| %P"
    export function Ball_return(P: Ball_Position): number {
        Function_c = 0x24
        Function_s = 2
        Identify_send()
        Identify_receive()
        switch (P) {
            case Ball_Position.status: return Ball_status
            case Ball_Position.X_axis: return Ball_X
            case Ball_Position.Y_axis: return Ball_Y
            case Ball_Position.Width: return Ball_W
            case Ball_Position.Depth: return Ball_H
            case Ball_Position.Re_effect: return Ball_pixels
            default: return 255
        }

    }



    // //###Voice recognition turned on||语音识别开启
    // /**
    // * IODO:Voice recognition turned on
    // */
    // //% subcategory=sensor
    // //% blockGap=8
    // //% blockId=sensor_Voicen block="Voice recognition turned on"
    // export function Voice(): void {
    //     voice_rx()
    //     voice_data()
    // }




}
