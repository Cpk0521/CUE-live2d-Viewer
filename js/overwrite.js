const CubismMotionSegmentType = {
  CubismMotionSegmentType_Linear : 0, // リニア
  CubismMotionSegmentType_Bezier : 1, // ベジェ曲線
  CubismMotionSegmentType_Stepped : 2, // ステップ
  CubismMotionSegmentType_InverseStepped : 3 // インバースステップ
}

function evaluateCurve(motionData, index, time,) {
  // Find segment to evaluate.
  const curve = motionData.curves[index];

  let target = -1;
  const totalSegmentCount =
    curve.baseSegmentIndex + curve.segmentCount;
  let pointPosition = 0;
  for (let i = curve.baseSegmentIndex; i < totalSegmentCount; ++i) {
    // Get first point of next segment.
    pointPosition =
      motionData.segments[i].basePointIndex +
      (motionData.segments[i].segmentType ==
      CubismMotionSegmentType.CubismMotionSegmentType_Bezier
        ? 3
        : 1);

    // Break if time lies within current segment.
    if (motionData.points[pointPosition].time > time) {
      target = i;
      break;
    }
  }

  if (target == -1) {
    return motionData.points[pointPosition].value;
  }

  const segment = motionData.segments[target];

  return segment.evaluate(
    motionData.points.slice(segment.basePointIndex),
    time,
  );
}

PIXI.live2d.CubismMotion.prototype.doUpdateParameters = function (model, userTimeSeconds, fadeWeight, motionQueueEntry,){

  if (this._modelCurveIdEyeBlink == null) {
    this._modelCurveIdEyeBlink = 'EyeBlink'
  }

  if (this._modelCurveIdLipSync == null) {
    this._modelCurveIdLipSync = 'LipSync';
  }

  let timeOffsetSeconds = userTimeSeconds - motionQueueEntry.getStartTime();

  if (timeOffsetSeconds < 0.0) {
    timeOffsetSeconds = 0.0; // エラー回避
  }

  let lipSyncValue = Number.MAX_VALUE;
  let eyeBlinkValue = Number.MAX_VALUE;

  //まばたき、リップシンクのうちモーションの適用を検出するためのビット（maxFlagCount個まで
  const MaxTargetSize = 64;
  let lipSyncFlags = 0;
  let eyeBlinkFlags = 0;

  //瞬き、リップシンクのターゲット数が上限を超えている場合
  if (this._eyeBlinkParameterIds.length > MaxTargetSize) {
    CubismLogDebug(
      'too many eye blink targets : {0}',
      this._eyeBlinkParameterIds.length,
    );
  }
  if (this._lipSyncParameterIds.length > MaxTargetSize) {
    CubismLogDebug(
      'too many lip sync targets : {0}',
      this._lipSyncParameterIds.length,
    );
  }

  const tmpFadeIn =
    this._fadeInSeconds <= 0.0
      ? 1.0
      : PIXI.live2d.CubismMath.getEasingSine(
        (userTimeSeconds - motionQueueEntry.getFadeInStartTime()) /
        this._fadeInSeconds,
      );

  const tmpFadeOut =
    this._fadeOutSeconds <= 0.0 || motionQueueEntry.getEndTime() < 0.0
      ? 1.0
      : PIXI.live2d.CubismMath.getEasingSine(
        (motionQueueEntry.getEndTime() - userTimeSeconds) /
        this._fadeOutSeconds,
      );
      
  let value;
  let c, parameterIndex;

  // 'Repeat' time as necessary.
  let time = timeOffsetSeconds;

  if (this._isLoop) {
    while (time > this._motionData.duration) {
      time -= this._motionData.duration;
    }
  }

  const curves = this._motionData.curves;

  // Evaluate model curves.
  for (
    c = 0;
    c < this._motionData.curveCount &&
    curves[c].type ==
    PIXI.live2d.CubismMotionCurveTarget.CubismMotionCurveTarget_Model;
    ++c
  ) {
    // Evaluate curve and call handler.
    value = evaluateCurve(this._motionData, c, time);

    if (curves[c].id == this._modelCurveIdEyeBlink) {
      eyeBlinkValue = value;
    } else if (curves[c].id == this._modelCurveIdLipSync) {
      lipSyncValue = value;
    }
  }

  let parameterMotionCurveCount = 0;

  for (
    ;
    c < this._motionData.curveCount &&
    curves[c].type ==
    PIXI.live2d.CubismMotionCurveTarget.CubismMotionCurveTarget_Parameter;
    ++c
  ) {

    parameterMotionCurveCount++;

    // Find parameter index.
    parameterIndex = model.getParameterIndex(curves[c].id);

    // Skip curve evaluation if no value in sink.
    if (parameterIndex == -1) {
      continue;
    }

    const sourceValue = model.getParameterValueByIndex(
      parameterIndex,
    );

    // Evaluate curve and apply value.
    value = evaluateCurve(this._motionData, c, time);

    if (eyeBlinkValue != Number.MAX_VALUE) {
      for (
        let i = 0;
        i < this._eyeBlinkParameterIds.length && i < MaxTargetSize;
        ++i
      ) {
        if (this._eyeBlinkParameterIds[i] == curves[c].id) {
          value *= eyeBlinkValue;
          eyeBlinkFlags |= 1 << i;
          break;
        }
      }
    }

    if (lipSyncValue != Number.MAX_VALUE) {
      for (
        let i = 0;
        i < this._lipSyncParameterIds.length && i < MaxTargetSize;
        ++i
      ) {
        if (this._lipSyncParameterIds[i] == curves[c].id) {
          value += lipSyncValue;
          lipSyncFlags |= 1 << i;
          break;
        }
      }
    }

    let v;

    // パラメータごとのフェード
    if (curves[c].fadeInTime < 0.0 && curves[c].fadeOutTime < 0.0) {
      // モーションのフェードを適用
      v = sourceValue + (value - sourceValue) * fadeWeight;
    } else {
      // パラメータに対してフェードインかフェードアウトが設定してある場合はそちらを適用
      let fin;
      let fout;

      if (curves[c].fadeInTime < 0.0) {
        fin = tmpFadeIn;
      } else {
        fin =
          curves[c].fadeInTime == 0.0
            ? 1.0
            : PIXI.live2d.CubismMath.getEasingSine(
            (userTimeSeconds - motionQueueEntry.getFadeInStartTime()) /
            curves[c].fadeInTime,
            );
      }

      if (curves[c].fadeOutTime < 0.0) {
        fout = tmpFadeOut;
      } else {
        fout =
          curves[c].fadeOutTime == 0.0 ||
          motionQueueEntry.getEndTime() < 0.0
            ? 1.0
            : PIXI.live2d.CubismMath.getEasingSine(
            (motionQueueEntry.getEndTime() - userTimeSeconds) /
            curves[c].fadeOutTime,
            );
      }

      const paramWeight = this._weight * fin * fout;

      // パラメータごとのフェードを適用
      v = sourceValue + (value - sourceValue) * paramWeight;
    }

    model.setParameterValueByIndex(parameterIndex, v, 1.0);
  }

  {
    if (eyeBlinkValue != Number.MAX_VALUE) {
      for (
        let i = 0;
        i < this._eyeBlinkParameterIds.length && i < MaxTargetSize;
        ++i
      ) {
        const sourceValue = model.getParameterValueById(
          this._eyeBlinkParameterIds[i],
        );

        // モーションでの上書きがあった時にはまばたきは適用しない
        if ((eyeBlinkFlags >> i) & 0x01) {
          continue;
        }

        const v =
          sourceValue + (eyeBlinkValue - sourceValue) * fadeWeight;

        model.setParameterValueById(this._eyeBlinkParameterIds[i], v);
      }
    }

    if (lipSyncValue != Number.MAX_VALUE) {
      for (
        let i = 0;
        i < this._lipSyncParameterIds.length && i < MaxTargetSize;
        ++i
      ) {
        const sourceValue = model.getParameterValueById(
          this._lipSyncParameterIds[i],
        );

        // モーションでの上書きがあった時にはリップシンクは適用しない
        if ((lipSyncFlags >> i) & 0x01) {
          continue;
        }

        const v =
          sourceValue + (lipSyncValue - sourceValue) * fadeWeight;

        model.setParameterValueById(this._lipSyncParameterIds[i], v);
      }
    }
  }

  //重寫讀取部件部分
  // for (let index = 0; index < curves.length; ++index) {
    
  //   if(curves[index].type != PIXI.live2d.CubismMotionCurveTarget.CubismMotionCurveTarget_PartOpacity)
  //     continue;
    
  //   parameterIndex = model.getPartIndex(curves.at(index).id);

  //   if (parameterIndex == -1)
  //     continue;
    
  //   value = evaluateCurve(this._motionData, index, time);

  //   model.setPartOpacityByIndex(parameterIndex, value);

  // }

  for (; c < curves.length; ++c) {
    
    if(curves[c].type != PIXI.live2d.CubismMotionCurveTarget.CubismMotionCurveTarget_PartOpacity)
      continue;
    
    parameterIndex = model.getPartIndex(curves.at(c).id);

    if (parameterIndex == -1)
      continue;
    
    value = evaluateCurve(this._motionData, c, time);

    model.setPartOpacityByIndex(parameterIndex, value);

  }



  // for (
  //   ;
  //   c < this._motionData.curveCount &&
  //   curves.at(c).type ==
  //     PIXI.live2d.CubismMotionCurveTarget.CubismMotionCurveTarget_PartOpacity;
  //   ++c
  // ) {
  //   // Find parameter index.
  //   parameterIndex = model.getParameterIndex(curves.at(c).id);

  //   // Skip curve evaluation if no value in sink.
  //   if (parameterIndex == -1) {
  //     continue;
  //   }

  //   // Evaluate curve and apply value.
  //   value = evaluateCurve(this._motionData, c, time);

  //   model.setParameterValueByIndex(parameterIndex, value);
  // }

  if (timeOffsetSeconds >= this._motionData.duration) {
    if (this._isLoop) {
      motionQueueEntry.setStartTime(userTimeSeconds); // 最初の状態へ
      if (this._isLoopFadeIn) {
        // ループ内でループ用フェードインが有効の時は、フェードイン設定し直し
        motionQueueEntry.setFadeInStartTime(userTimeSeconds);
      }
    } else {
      if (this._onFinishedMotion) {
        this._onFinishedMotion(this);
      }

      motionQueueEntry.setIsFinished(true);
    }
  }
  this._lastWeight = fadeWeight;
}

//重寫執行動作部分 強制打斷之前的動作
PIXI.live2d.Live2DModel.prototype.motion = async function (group, index, priority) {
  if (priority === "FORCE")
    await this.internalModel.motionManager.stopAllMotions();
  const res =
    index === undefined
      ? await this.internalModel.motionManager.startRandomMotion(
          group,
          priority
        )
      : await this.internalModel.motionManager.startMotion(
          group,
          index,
          priority
        );
  return res;
};